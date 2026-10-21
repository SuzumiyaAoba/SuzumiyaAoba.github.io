// @vitest-environment jsdom

import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { Group } from "three";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import type { Locale } from "@/shared/lib/routing";
import type {
  AudioModel,
  ViewerHandle,
  AudioModelBuilder,
} from "@/shared/ui/audio/definitions/viewer";
import { AudioViewer } from "./audio-viewer";
import { createAudioViewer } from "./viewer-runtime";
import { loadAudioModel } from "./viewer-model-loader";

vi.mock(import("./viewer-runtime"), () => ({
  createAudioViewer: vi.fn<typeof createAudioViewer>(),
}));
vi.mock(import("./viewer-model-loader"), () => ({
  loadAudioModel: vi.fn<typeof loadAudioModel>(),
}));

const createViewer = vi.mocked(createAudioViewer);
const loadModel = vi.mocked(loadAudioModel);
let container: HTMLDivElement;
let root: Root | null;
let handle: ViewerHandle;
let notifyVisibility: (entries: { isIntersecting: boolean }[]) => void;
let initiallyVisible: boolean;

function VisibilityObserver(this: unknown, onEntries: typeof notifyVisibility) {
  notifyVisibility = onEntries;
  return {
    observe() {
      onEntries([{ isIntersecting: initiallyVisible }]);
    },
    disconnect() {},
  };
}

beforeEach(() => {
  initiallyVisible = true;
  vi.stubGlobal("IntersectionObserver", VisibilityObserver);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  loadModel
    .mockReset()
    .mockResolvedValue(() => ({ group: new Group(), dispose() {} }));
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true }))
  );
  handle = {
    setModel: vi.fn<ViewerHandle["setModel"]>(),
    setHeadphones: vi.fn<NonNullable<ViewerHandle["setHeadphones"]>>(),
    setView: vi.fn<ViewerHandle["setView"]>(),
    zoom: vi.fn<ViewerHandle["zoom"]>(),
    setInteractive: vi.fn<ViewerHandle["setInteractive"]>(),
    dispose: vi.fn<ViewerHandle["dispose"]>(),
  };
  createViewer.mockReset().mockImplementation(({ onStatus, onView }) => {
    onStatus("ready");
    onView("overview");
    return handle;
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  container.remove();
  vi.unstubAllGlobals();
});

async function render(model: AudioModel = "system", locale: Locale = "ja") {
  await act(async () => {
    const viewer = (
      <AudioViewer
        model={model}
        locale={locale}
        manufacturer="Audio"
        name="接続全体"
        finish="Silver"
        description="説明"
      />
    );
    root?.render(viewer);
  });
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

function button(label: string) {
  const element = [...container.querySelectorAll("button")].find(
    (candidate) =>
      candidate.textContent === label ||
      candidate.getAttribute("aria-label") === label
  );
  if (!element) {
    throw new Error(`Viewer button not found: ${label}`);
  }
  return element;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

it("読み込み後に操作を有効化し、視点・ズーム・ドラッグ操作をビューアへ伝える", async () => {
  await render();
  expect(container.querySelector("canvas")?.tabIndex).toBe(0);
  expect(button("正面").disabled).toBe(false);
  expect(handle.setInteractive).toHaveBeenCalledWith(true);
  await click("正面");
  expect(handle.setView).toHaveBeenLastCalledWith("front");
  expect(button("正面").getAttribute("aria-pressed")).toBe("true");
  await click("拡大");
  expect(handle.zoom).toHaveBeenLastCalledWith("in");
  await click("縮小");
  expect(handle.zoom).toHaveBeenLastCalledWith("out");
  await click("ドラッグ操作");
  expect(handle.setInteractive).toHaveBeenLastCalledWith(false);
  await click("視点を戻す");
  expect(handle.setView).toHaveBeenLastCalledWith("overview");
});

it("タッチ環境ではドラッグ操作を無効にして読み込む", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false }))
  );
  await render("ud-505");
  expect(handle.setInteractive).toHaveBeenLastCalledWith(false);
  expect(button("ドラッグ操作").getAttribute("aria-pressed")).toBe("false");
  expect(container.textContent).not.toContain("接続するヘッドホン");
});

it("読み込み失敗時は操作を無効にし、キャンバスを交換して再試行する", async () => {
  createViewer.mockImplementationOnce(() => {
    throw new Error("WebGL unavailable");
  });
  await render();
  const surface = container.querySelector("canvas");
  expect(surface?.tabIndex).toBe(-1);
  expect(button("正面").disabled).toBe(true);
  expect(container.textContent).toContain("この環境では3D表示を利用できません");
  await click("再読み込み");
  expect(createViewer).toHaveBeenCalledTimes(2);
  expect(container.querySelector("canvas")).not.toBe(surface);
  expect(button("全体").getAttribute("aria-pressed")).toBe("true");
  expect(button("正面").disabled).toBe(false);
});

it("選択したヘッドホンを再読み込み後も保持し、古いビューアの通知を無視する", async () => {
  await render();
  await click("Clear Mg Professional");
  expect(handle.setHeadphones).toHaveBeenLastCalledWith("clear-mg-pro");
  expect(
    container.querySelector("canvas")?.getAttribute("aria-label")
  ).toContain("Clear Mg Professional");
  const options = createViewer.mock.calls[0]?.[0];
  await act(async () => options?.onStatus("unavailable"));
  await click("再読み込み");
  expect(handle.dispose).toHaveBeenCalledTimes(1);
  expect(handle.setHeadphones).toHaveBeenLastCalledWith("clear-mg-pro");
  await act(async () => {
    options?.onStatus("unavailable");
    options?.onView("rear");
  });
  expect(button("正面").disabled).toBe(false);
  expect(button("全体").getAttribute("aria-pressed")).toBe("true");
});

it("モデル変更ではビューアを再利用し、アンマウントで破棄する", async () => {
  await render();
  await render("ud-505");
  expect(handle.dispose).not.toHaveBeenCalled();
  expect(handle.setModel).toHaveBeenCalledWith("ud-505", expect.any(Function));
  expect(createViewer).toHaveBeenCalledTimes(1);
  await act(async () => root?.unmount());
  root = null;
  expect(handle.dispose).toHaveBeenCalledTimes(1);
});

it.each([
  ["ja", "HD 800 S"],
  ["ja", "Clear Mg Professional"],
  ["en", "HD 800 S"],
  ["en", "Clear Mg Professional"],
] as const)(
  "%s: IE 600 は UD-505 の4.4 mm出力に、%s は HA-1A MK2 に接続する",
  async (locale, headphone) => {
    await render("system", locale);
    await click("IE 600");
    expect(handle.setHeadphones).toHaveBeenLastCalledWith("ie-600");
    expect(button("IE 600").getAttribute("aria-pressed")).toBe("true");
    const connection = container.querySelector("output")?.textContent;
    expect(connection).toContain("UD-505");
    expect(connection).toContain("4.4 mm");
    expect(connection).not.toContain("HA-1A MK2");
    expect(connection).not.toContain("3.5 mm");
    const label = container.querySelector("canvas")?.getAttribute("aria-label");
    expect(label).toContain("IE 600");
    expect(label).toContain("4.4 mm");
    await click(headphone);
    expect(container.querySelector("output")?.textContent).toContain(
      "HA-1A MK2"
    );
    expect(container.querySelector("output")?.textContent).toContain("6.35 mm");
    expect(
      container.querySelector("canvas")?.getAttribute("aria-label")
    ).not.toContain("4.4 mm");
  }
);

it("Strict Mode で読み込み完了前にアンマウントするとビューアを生成しない", async () => {
  act(() => {
    root?.render(
      <StrictMode>
        <AudioViewer
          model="system"
          locale="ja"
          manufacturer="Audio"
          name="接続全体"
          finish="Silver"
          description="説明"
        />
      </StrictMode>
    );
  });
  act(() => root?.unmount());
  root = null;
  await act(async () => {
    await vi.dynamicImportSettled();
  });
  expect(createViewer).not.toHaveBeenCalled();
  expect(handle.dispose).not.toHaveBeenCalled();
});

it("操作の初期化に失敗したビューアを破棄し、アンマウントで二重に破棄しない", async () => {
  vi.mocked(handle.setInteractive).mockImplementation(() => {
    throw new Error("Interaction setup failed");
  });
  await render();
  expect(handle.dispose).toHaveBeenCalledTimes(1);
  expect(button("再読み込み").disabled).toBe(false);
  await act(async () => root?.unmount());
  root = null;
  expect(handle.dispose).toHaveBeenCalledTimes(1);
});

it("モデルを読み込み中にアンマウントすると、遅れて届いても描画を開始しない", async () => {
  const pending = Promise.withResolvers<AudioModelBuilder>();
  loadModel.mockReturnValueOnce(pending.promise);
  await render("cg-10m");
  expect(createViewer).not.toHaveBeenCalled();
  await act(async () => root?.unmount());
  root = null;
  await act(async () =>
    pending.resolve(() => ({ group: new Group(), dispose() {} }))
  );
  expect(createViewer).not.toHaveBeenCalled();
  expect(handle.dispose).not.toHaveBeenCalled();
});

it("画面外のモデルは読み込まず、表示領域に近づいたときに一度だけ生成する", async () => {
  initiallyVisible = false;
  await render("ud-505");
  expect(loadModel).not.toHaveBeenCalled();
  expect(createViewer).not.toHaveBeenCalled();
  expect(button("正面").disabled).toBe(true);
  await act(async () => {
    notifyVisibility([{ isIntersecting: true }]);
    notifyVisibility([{ isIntersecting: true }]);
    await vi.dynamicImportSettled();
  });
  expect(loadModel).toHaveBeenCalledTimes(1);
  expect(createViewer).toHaveBeenCalledTimes(1);
  expect(button("正面").disabled).toBe(false);
});

it("画面外でアンマウントしたモデルは遅れて表示通知が来ても読み込まない", async () => {
  initiallyVisible = false;
  await render();
  await act(async () => root?.unmount());
  root = null;
  await act(async () => {
    notifyVisibility([{ isIntersecting: true }]);
    await vi.dynamicImportSettled();
  });
  expect(loadModel).not.toHaveBeenCalled();
  expect(createViewer).not.toHaveBeenCalled();
});
