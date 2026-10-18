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
  HeadphoneModel,
} from "../model/viewer";
import { createViewerCamera } from "./viewer-camera";
import { createViewerScene } from "./viewer-scene";
import { createViewerRenderLoop } from "./viewer-render-loop";
import type { AudioModelBuilder } from "./viewer-model-loader";
import { prepareViewerShaders } from "./viewer-shader-preparation";

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
  let contextLost = false;
  let prepared = false;
  let ready = false;
  let preparation = 0;
  let headphones: HeadphoneModel = "hd-800s";
  let sceneResources: ReturnType<typeof createViewerScene> | undefined;
  let cameraController: ReturnType<typeof createViewerCamera> | undefined;
  let renderLoop: ReturnType<typeof createViewerRenderLoop> | undefined;
  const invalidate = () => renderLoop?.invalidate();
  const unavailable = () => {
    prepared = false;
    ready = false;
    preparation += 1;
    renderLoop?.setActive(false);
    onStatus("unavailable");
  };
  const lost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    unavailable();
  };
  const restored = () => {
    contextLost = false;
    sceneResources?.refresh();
    void prepare();
  };

  async function prepare() {
    if (disposed || contextLost || !sceneResources || !cameraController) {
      return;
    }
    preparation += 1;
    const attempt = preparation;
    prepared = false;
    ready = false;
    renderLoop?.setActive(false);
    onStatus("loading");
    try {
      await prepareViewerShaders(
        renderer,
        sceneResources.scene,
        cameraController.camera
      );
      if (disposed || contextLost || attempt !== preparation) {
        return;
      }
      prepared = true;
      renderLoop?.setActive(true);
    } catch {
      if (!disposed && attempt === preparation) {
        unavailable();
      }
    }
  }

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
        if (!prepared || disposed || contextLost) {
          return;
        }
        try {
          renderer.render(resources.scene, camera.camera);
          if (!ready) {
            ready = true;
            onStatus("ready");
          }
        } catch {
          unavailable();
        }
      },
    });
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    void prepare();

    return {
      setHeadphones(selected) {
        if (disposed || selected === headphones) {
          return;
        }
        try {
          resources.setHeadphones(selected);
          headphones = selected;
          void prepare();
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
