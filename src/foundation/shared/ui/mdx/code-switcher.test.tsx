// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { highlight } from "codehike/code";
import type { HighlightedCode, RawCode } from "codehike/code";
import { CodeSwitcher } from "./code-switcher";

vi.mock(import("codehike/code"), () => ({
  highlight: vi.fn<typeof highlight>(),
}));
vi.mock(import("./custom-code-block"), () => ({
  CustomCodeBlock: ({ code }: { code: HighlightedCode }) => (
    <pre>{code.code}</pre>
  ),
}));

function highlighted(code: RawCode): HighlightedCode {
  return {
    ...code,
    code: code.value,
    tokens: [],
    annotations: [],
    themeName: "test",
    style: {},
  };
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  vi.mocked(highlight).mockImplementation(async (code) => highlighted(code));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("CodeSwitcher", () => {
  it("空のコードとコードありの表示を切り替えられる", async () => {
    await act(async () => root.render(<CodeSwitcher code={[]} />));
    expect(container.textContent).toBe("");
    await act(async () =>
      root.render(
        <CodeSwitcher code={[{ value: "first", lang: "ts", meta: "" }]} />
      )
    );
    expect(container.querySelector("pre")?.textContent).toBe("first");
    await act(async () => root.render(<CodeSwitcher code={[]} />));
    expect(container.textContent).toBe("");
  });

  it("ハイライト失敗を処理してエラーを表示する", async () => {
    vi.mocked(highlight).mockRejectedValueOnce(
      new Error("Unsupported language")
    );
    await act(async () =>
      root.render(
        <CodeSwitcher
          code={[{ value: "invalid", lang: "unknown", meta: "" }]}
        />
      )
    );
    expect(container.textContent).toBe("Unable to highlight code.");
  });

  it("古いハイライトが後から完了しても現在のコードを上書きしない", async () => {
    const pending = Promise.withResolvers<HighlightedCode>();
    vi.mocked(highlight).mockReturnValueOnce(pending.promise);
    const previous = { value: "previous", lang: "ts", meta: "" };
    await act(async () => root.render(<CodeSwitcher code={[previous]} />));
    await act(async () =>
      root.render(
        <CodeSwitcher code={[{ value: "current", lang: "ts", meta: "" }]} />
      )
    );
    await act(async () => {
      pending.resolve(highlighted(previous));
    });
    expect(container.querySelector("pre")?.textContent).toBe("current");
  });
});
