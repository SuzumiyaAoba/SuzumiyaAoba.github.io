// @vitest-environment jsdom

import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { LlmAttentionDemo } from "./attention-demo";
import { LlmMlpDemo } from "./representation-demos";
import { LlmSamplingDemo } from "./sampling-demo";
import { LlmTrainingDemo } from "./training-demo";
import { LlmArchitecture3D } from "./structure-demo";
import { LlmGenerationFlow } from "./generation-demo";

let host: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  ["MLP", LlmMlpDemo],
  ["Attention", LlmAttentionDemo],
  ["Sampling", LlmSamplingDemo],
  ["Training", LlmTrainingDemo],
  ["3D structure", LlmArchitecture3D],
  ["generation flow", LlmGenerationFlow],
] as const)(
  "%sの計算に微小な環境差があってもhydrateできる",
  async (_, Demo) => {
    const originalTanh = Math.tanh;
    const originalExp = Math.exp;
    const originalSin = Math.sin;
    const originalCos = Math.cos;
    const tanh = vi
      .spyOn(Math, "tanh")
      .mockImplementation((value) => originalTanh(value) + Number.EPSILON);
    const exp = vi
      .spyOn(Math, "exp")
      .mockImplementation((value) =>
        value === 0 ? 1 : originalExp(value) * (1 + Number.EPSILON)
      );
    const sin = vi
      .spyOn(Math, "sin")
      .mockImplementation((value) =>
        value === 0 ? 0 : originalSin(value) + Number.EPSILON
      );
    const cos = vi
      .spyOn(Math, "cos")
      .mockImplementation((value) =>
        value === 0 ? 1 : originalCos(value) - Number.EPSILON
      );
    host.innerHTML = renderToString(<Demo />);
    tanh.mockRestore();
    exp.mockRestore();
    sin.mockRestore();
    cos.mockRestore();

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onRecoverableError = vi.fn<() => void>();
    await act(async () => {
      root = hydrateRoot(host, <Demo />, { onRecoverableError });
    });

    expect(consoleError).not.toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();
  }
);
