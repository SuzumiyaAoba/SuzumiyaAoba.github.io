import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import type {
  ViewerHandle,
  ViewerStatus,
  AudioModel,
  AudioView,
} from "../model/viewer";
import { createViewerCamera } from "./viewer-camera";
import { createViewerScene } from "./viewer-scene";

type ViewerOptions = {
  model: AudioModel;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onStatus: (status: ViewerStatus) => void;
  onView: (view: AudioView | undefined) => void;
};

export function createAudioViewer({
  model: modelId,
  canvas,
  container,
  onStatus,
  onView,
}: ViewerOptions): ViewerHandle {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const sceneResources = createViewerScene(renderer, modelId, invalidate);

  let frame = 0;
  let visible = true;
  let disposed = false;
  let contextLost = false;
  const cameraController = createViewerCamera({
    model: modelId,
    canvas,
    onChange: invalidate,
    onView,
  });

  function invalidate() {
    if (frame || disposed || contextLost || !visible || document.hidden) {
      return;
    }
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (disposed || contextLost) {
        return;
      }
      renderer.render(sceneResources.scene, cameraController.camera);
    });
  }

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) {
      return;
    }
    renderer.setSize(width, height, false);
    cameraController.resize(width / height);
    invalidate();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    invalidate();
  });
  visibilityObserver.observe(container);
  document.addEventListener("visibilitychange", invalidate);
  const lost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    onStatus("unavailable");
  };
  const restored = () => {
    contextLost = false;
    invalidate();
    onStatus("ready");
  };
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  resize();
  onStatus("ready");

  return {
    setHeadphones(selected) {
      sceneResources.setHeadphones(selected);
      invalidate();
    },
    setView: cameraController.setView,
    zoom: cameraController.zoom,
    setInteractive: cameraController.setInteractive,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", invalidate);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      cameraController.dispose();
      sceneResources.dispose();
      renderer.dispose();
    },
  };
}
