// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, assert, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useAnchorObserver } from "./use-anchor-observer";

const observers: MockObserver[] = [];
class MockObserver implements IntersectionObserver {
  public readonly root = null;
  public readonly rootMargin = "0px";
  public readonly scrollMargin = "0px";
  public readonly thresholds = [0];
  public unobserve = vi.fn<(target: Element) => void>();
  public takeRecords = vi.fn<() => IntersectionObserverEntry[]>(() => []);
  private readonly onEntries: IntersectionObserverCallback;
  public observe = vi.fn<(target: Element) => void>();
  public disconnect = vi.fn<() => void>();
  public constructor(onEntries: IntersectionObserverCallback) {
    this.onEntries = onEntries;
    observers.push(this);
  }
  public update(ids: string[], visible = true) {
    const entries: IntersectionObserverEntry[] = ids.map((id) => {
      // oxlint-disable-next-line unicorn/prefer-query-selector -- CSS セレクターとして無効な見出し ID もそのまま検索する。
      const target = document.getElementById(id);
      assert(target);
      return {
        target,
        isIntersecting: visible,
        rootBounds: new DOMRectReadOnly(),
        boundingClientRect: new DOMRectReadOnly(),
        intersectionRect: new DOMRectReadOnly(),
        intersectionRatio: visible ? 1 : 0,
        time: 0,
      };
    });
    this.onEntries(entries, this);
  }
}

function observerAt(index: number) {
  const observer = observers[index];
  assert(observer);
  return observer;
}

function Probe({ watch, single = false }: { watch: string[]; single?: boolean }) {
  return <output>{useAnchorObserver(watch, single).join(",")}</output>;
}

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal("IntersectionObserver", MockObserver);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  for (const id of ["first", "second", "third"]) {
    const heading = document.createElement("h2");
    heading.id = id;
    document.body.append(heading);
  }
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("useAnchorObserver", () => {
  it("数字や句読点を含む見出し ID をそのまま監視する", async () => {
    const heading = document.createElement("h2");
    heading.id = "1.見出し:概要";
    document.body.append(heading);
    await act(async () => root.render(<Probe watch={["first", heading.id]} />));
    expect(observerAt(0).observe).toHaveBeenCalledWith(heading);
    await act(async () => observerAt(0).update([heading.id]));
    expect(container.textContent).toBe(heading.id);
  });

  it("可視領域への通知順ではなく目次の順で見出しを選ぶ", async () => {
    await act(async () => root.render(<Probe watch={["first", "second"]} />));
    await act(async () => observerAt(0).update(["second", "first"]));
    expect(container.textContent).toBe("first,second");
  });

  it("単一選択への切替で監視を張り直し、対象見出しを再登録する", async () => {
    const watch = ["first", "second"];
    await act(async () => root.render(<Probe watch={watch} />));
    await act(async () => root.render(<Probe watch={watch} single />));
    expect(observerAt(0).disconnect).toHaveBeenCalledTimes(1);
    expect(observerAt(1).observe).toHaveBeenCalledTimes(2);
    await act(async () => observerAt(1).update(["second", "first"]));
    expect(container.textContent).toBe("first");
  });

  it("目次変更後に以前の可視見出しを引き継がず、監視を解放する", async () => {
    await act(async () => root.render(<Probe watch={["first"]} />));
    await act(async () => observerAt(0).update(["first"]));
    await act(async () => root.render(<Probe watch={["third", "missing"]} />));
    expect(observerAt(1).observe).toHaveBeenCalledTimes(1);
    await act(async () => observerAt(1).update(["third"], false));
    expect(container.textContent).toBe("third");
    await act(async () => root.render(null));
    expect(observerAt(1).disconnect).toHaveBeenCalledTimes(1);
  });
});
