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
import { createViewerRenderLoop } from "./viewer-render-loop";
import type { AudioModelBuilder } from "./viewer-model-loader";

type ViewerOptions = {
  model: AudioModel;
  createModel: AudioModelBuilder;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onStatus: (status: ViewerStatus) => void;
  onView: (view: AudioView | undefined) => void;
};

export function createAudioViewer({
  model: modelId,
  createModel,
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

  let disposed = false;
  let sceneResources: ReturnType<typeof createViewerScene> | undefined;
  let cameraController: ReturnType<typeof createViewerCamera> | undefined;
  let renderLoop: ReturnType<typeof createViewerRenderLoop> | undefined;
  const invalidate = () => renderLoop?.invalidate();
  const unavailable = () => {
    renderLoop?.setActive(false);
    onStatus("unavailable");
  };
  const lost = (event: Event) => {
    event.preventDefault();
    unavailable();
  };
  const restored = () => {
    sceneResources?.refresh();
    renderLoop?.setActive(true);
    onStatus("ready");
  };

  const dispose = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", restored);
    renderLoop?.dispose();
    cameraController?.dispose();
    sceneResources?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };

  try {
    const resources = createViewerScene(
      renderer,
      modelId,
      createModel,
      invalidate
    );
    sceneResources = resources;
    const camera = createViewerCamera({
      model: modelId,
      canvas,
      onChange: invalidate,
      onView,
    });
    cameraController = camera;
    renderLoop = createViewerRenderLoop({
      container,
      resize(width, height) {
        renderer.setSize(width, height, false);
        camera.resize(width / height);
      },
      render() {
        try {
          renderer.render(resources.scene, camera.camera);
        } catch {
          unavailable();
        }
      },
    });
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    onStatus("ready");

    return {
      setHeadphones(selected) {
        try {
          resources.setHeadphones(selected);
        } catch {
          unavailable();
        }
      },
      setView: camera.setView,
      zoom: camera.zoom,
      setInteractive: camera.setInteractive,
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
