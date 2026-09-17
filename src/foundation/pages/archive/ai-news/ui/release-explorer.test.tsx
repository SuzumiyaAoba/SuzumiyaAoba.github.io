// @vitest-environment jsdom

import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { ReleaseExplorer } from "./release-explorer";
import type { RenderedRelease } from "../model/release-calendar";

function ResizeObserverStub(this: unknown) {
  return {
    observe() {},
    unobserve() {},
    disconnect() {},
  };
}

function release(
  title: string,
  date: string,
  provider: string,
  series: string[]
): RenderedRelease {
  return {
    title,
    summary: "Details",
    entry: {
      year: Number(date.slice(0, 4)),
      date,
      title: { ja: title },
      summary: { ja: "Details" },
      tags: [provider, "LLM Model"],
      series,
    },
  };
}

const entries = [
  release("GPT Next", "2026-03-05", "OpenAI", ["GPT"]),
  release("Gemini Flash Next", "2026-03-05", "Google", ["Gemini Flash"]),
  release("Claude Opus Next", "2026-02-05", "Anthropic", ["Claude Opus"]),
  release("Claude Opus Previous", "2025-12-31", "Anthropic", ["Claude Opus"]),
];

const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
let container: HTMLDivElement;
let root: Root | null;

async function render(
  searchParams: Record<string, string> = {}
): Promise<void> {
  await act(async () => {
    root?.render(
      <StrictMode>
        <NuqsTestingAdapter
          hasMemory
          searchParams={searchParams}
          onUrlUpdate={onUrlUpdate}
        >
          <ReleaseExplorer entries={entries} locale="ja" today="2026-03-06" />
        </NuqsTestingAdapter>
      </StrictMode>
    );
  });
}

async function flush(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
}

function button(name: string): HTMLButtonElement {
  const element = [...container.querySelectorAll("button")].find(
    (item) => item.getAttribute("aria-label") === name
  );
  if (!element) {
    throw new Error(`Button not found: ${name}`);
  }
  return element;
}

async function click(name: string): Promise<void> {
  await act(async () => {
    button(name).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function status(): string {
  return container.querySelector("output")?.textContent ?? "";
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  onUrlUpdate.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  container.remove();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ReleaseExplorer selection and URL sync", () => {
  it("URLのプロバイダ・モデル選択を初期表示へ反映する", async () => {
    await render({ providers: "OpenAI", models: "Claude Opus" });
    await flush();
    expect(status()).toContain("4 件中 3 件");
    expect(button("OpenAI").getAttribute("aria-pressed")).toBe("true");
    expect(button("Claude Opus · Anthropic").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(button("Gemini Flash · Google").getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  it("チップのトグルをクエリパラメータへ書き込む", async () => {
    await render();
    await flush();
    await click("Anthropic");
    await flush();
    expect(status()).toContain("4 件中 2 件");
    expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("providers")).toBe(
      "Anthropic"
    );
    await click("GPT · OpenAI");
    await flush();
    expect(status()).toContain("4 件中 3 件");
    const update = onUrlUpdate.mock.lastCall?.[0];
    expect(update?.searchParams.get("providers")).toBe("Anthropic");
    expect(update?.searchParams.get("models")).toBe("GPT");
  });

  it("複数選択と「すべて」のリセットがURLへ反映される", async () => {
    await render();
    await flush();
    await click("OpenAI");
    await click("Google");
    await flush();
    expect(status()).toContain("4 件中 2 件");
    expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("providers")).toBe(
      "OpenAI,Google"
    );
    await click("すべてのリリースを表示");
    await flush();
    expect(status()).toContain("4 件中 4 件");
    const update = onUrlUpdate.mock.lastCall?.[0];
    expect(update?.searchParams.has("providers")).toBe(false);
    expect(update?.searchParams.has("models")).toBe(false);
  });

  it("URLの未知の値を取り除いて書き戻す", async () => {
    await render({ providers: "OpenAI,Unknown Co", models: "GPT,Ghost" });
    await flush();
    expect(status()).toContain("4 件中 1 件");
    const update = onUrlUpdate.mock.lastCall?.[0];
    expect(update?.searchParams.get("providers")).toBe("OpenAI");
    expect(update?.searchParams.get("models")).toBe("GPT");
  });
});
