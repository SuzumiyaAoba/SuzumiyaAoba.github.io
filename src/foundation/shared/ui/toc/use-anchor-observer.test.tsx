// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnchorObserver } from "./use-anchor-observer";

const observers: MockObserver[] = [];
class MockObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(private callback: IntersectionObserverCallback) {
    observers.push(this);
  }
  update(ids: string[], visible = true) {
    const entries: IntersectionObserverEntry[] = ids.map((id) => ({
      target: document.getElementById(id)!,
      isIntersecting: visible,
      rootBounds: new DOMRectReadOnly(),
      boundingClientRect: new DOMRectReadOnly(),
      intersectionRect: new DOMRectReadOnly(),
      intersectionRatio: visible ? 1 : 0,
      time: 0,
    }));
    this.callback(entries, this as unknown as IntersectionObserver);
  }
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
  it("可視領域への通知順ではなく目次の順で見出しを選ぶ", async () => {
    await act(async () => root.render(<Probe watch={["first", "second"]} />));
    await act(async () => observers[0]!.update(["second", "first"]));
    expect(container.textContent).toBe("first,second");
  });

  it("単一選択への切替で監視を張り直し、対象見出しを再登録する", async () => {
    const watch = ["first", "second"];
    await act(async () => root.render(<Probe watch={watch} />));
    await act(async () => root.render(<Probe watch={watch} single />));
    expect(observers[0]!.disconnect).toHaveBeenCalledOnce();
    expect(observers[1]!.observe).toHaveBeenCalledTimes(2);
    await act(async () => observers[1]!.update(["second", "first"]));
    expect(container.textContent).toBe("first");
  });

  it("目次変更後に以前の可視見出しを引き継がず、監視を解放する", async () => {
    await act(async () => root.render(<Probe watch={["first"]} />));
    await act(async () => observers[0]!.update(["first"]));
    await act(async () => root.render(<Probe watch={["third", "missing"]} />));
    expect(observers[1]!.observe).toHaveBeenCalledOnce();
    await act(async () => observers[1]!.update(["third"], false));
    expect(container.textContent).toBe("third");
    await act(async () => root.render(null));
    expect(observers[1]!.disconnect).toHaveBeenCalledOnce();
  });
});
