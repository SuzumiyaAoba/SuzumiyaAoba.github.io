type RenderLoopOptions = {
  container: HTMLElement;
  render: () => void;
  resize: (width: number, height: number) => void;
};

/** 表示中の変更を1フレームにまとめ、画面外では描画予約も止める。 */
export function createViewerRenderLoop({
  container,
  render,
  resize,
}: RenderLoopOptions) {
  let frame: number | undefined;
  let visible = true;
  let active = true;
  let disposed = false;
  let width = 0;
  let height = 0;

  const canRender = () => active && visible && !disposed && !document.hidden;
  const cancelFrame = () => {
    if (frame !== undefined) {
      window.cancelAnimationFrame(frame);
      frame = undefined;
    }
  };
  const invalidate = () => {
    if (!canRender()) {
      cancelFrame();
      return;
    }
    if (frame !== undefined) {
      return;
    }
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      if (canRender()) {
        render();
      }
    });
  };
  const updateSize = () => {
    const bounds = container.getBoundingClientRect();
    if (
      disposed ||
      bounds.width === 0 ||
      bounds.height === 0 ||
      (bounds.width === width && bounds.height === height)
    ) {
      return;
    }
    ({ width, height } = bounds);
    resize(width, height);
    invalidate();
  };

  const resizeObserver = new ResizeObserver(updateSize);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    invalidate();
  });
  const dispose = () => {
    disposed = true;
    cancelFrame();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener("visibilitychange", invalidate);
  };
  try {
    resizeObserver.observe(container);
    visibilityObserver.observe(container);
    document.addEventListener("visibilitychange", invalidate);
    updateSize();
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    invalidate,
    setActive(enabled: boolean) {
      active = enabled;
      invalidate();
    },
    dispose,
  };
}
