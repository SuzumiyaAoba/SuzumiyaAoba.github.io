import { afterEach, expect, it, vi } from "vite-plus/test";
import { createModelParts } from "./parts";

afterEach(() => vi.unstubAllGlobals());

it.each([
  [20, 10, 2048, 2048, 1024],
  [10, 20, 2048, 1024, 2048],
  [10, 10, 512, 512, 512],
  [100, 0.001, 512, 512, 1],
])(
  "%s × %s mm の印字画像を長辺 %s px 内に収める",
  (width, height, resolution, expectedWidth, expectedHeight) => {
    const context = { scale: vi.fn<CanvasRenderingContext2D["scale"]>() };
    const canvas = { width: 0, height: 0, getContext: () => context };
    vi.stubGlobal("document", { createElement: () => canvas });
    const draw = vi.fn<(context: CanvasRenderingContext2D) => void>();
    const parts = createModelParts();
    parts.print(
      width,
      height,
      [0, 0, 0],
      draw,
      "Product lettering",
      resolution
    );
    expect(canvas).toMatchObject({
      width: expectedWidth,
      height: expectedHeight,
    });
    expect(context.scale).toHaveBeenCalledWith(
      expectedWidth / width,
      expectedHeight / height
    );
    expect(draw).toHaveBeenCalledWith(context);
    parts.dispose();
  }
);
