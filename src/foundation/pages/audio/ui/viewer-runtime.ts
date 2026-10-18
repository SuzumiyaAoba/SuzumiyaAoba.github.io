import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import type {
  AudioModel,
  AudioModelBuilder,
  AudioView,
  HeadphoneModel,
  ViewerHandle,
  ViewerStatus,
} from "../model/viewer";
import { createViewerCamera } from "./viewer-camera";
import { createViewerEnvironment } from "./viewer-environment";
import { createViewerScene } from "./viewer-scene";
import { createViewerRenderLoop } from "./viewer-render-loop";
import { prepareViewerShaders } from "./viewer-shader-preparation";
import { upgradeAudioTextures } from "./scene/texture-images";

const sceneCacheLimit = 2;
type SceneResources = ReturnType<typeof createViewerScene>;
type ViewerOptions = {
  model: AudioModel;
  createModel: AudioModelBuilder;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onStatus: (status: ViewerStatus) => void;
  onView: (view: AudioView | undefined) => void;
};

export function createAudioViewer({
  model: initialModel,
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

  const scenes = new Map<AudioModel, SceneResources>();
  const upgraded = new Set<AudioModel>();
  let modelId = initialModel;
  let disposed = false;
  let contextLost = false;
  let prepared = false;
  let ready = false;
  let preparation = 0;
  let interactive = false;
  let width = 0;
  let height = 0;
  let headphones: HeadphoneModel = "hd-800s";
  let environment: ReturnType<typeof createViewerEnvironment> | undefined;
  let sceneResources: SceneResources | undefined;
  let cameraController: ReturnType<typeof createViewerCamera> | undefined;
  let renderLoop: ReturnType<typeof createViewerRenderLoop> | undefined;
  const invalidate = () => renderLoop?.invalidate();
  const pauseRendering = () => {
    preparation += 1;
    prepared = false;
    renderLoop?.setActive(false);
    return preparation;
  };
  const beginLoading = () => {
    const attempt = pauseRendering();
    ready = false;
    onStatus("loading");
    return attempt;
  };
  const unavailable = () => {
    pauseRendering();
    ready = false;
    onStatus("unavailable");
  };
  const lost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    unavailable();
  };
  const restored = () => {
    contextLost = false;
    try {
      const previous = environment;
      environment = createViewerEnvironment(renderer);
      for (const resources of scenes.values()) {
        resources.scene.environment = environment.texture;
        resources.refresh();
      }
      previous?.dispose();
      void prepare();
    } catch {
      unavailable();
    }
  };

  async function upgradeTextures(model: AudioModel) {
    try {
      await upgradeAudioTextures(model);
      if (!disposed) {
        scenes.get(model)?.refresh();
      }
    } catch {
      // 詳細画像を取得できなくても、生成済みの軽量画像で操作を続ける。
    }
  }

  async function prepare() {
    if (disposed || contextLost || !sceneResources || !cameraController) {
      return;
    }
    // 詳細度の切り替えでは直前の描画と操作状態を維持する。
    const attempt = ready ? pauseRendering() : beginLoading();
    const resources = sceneResources;
    const { camera } = cameraController;
    try {
      resources.updateDetail(camera, height);
      await prepareViewerShaders(renderer, resources.scene, camera);
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

  function activateModel(model: AudioModel, build: AudioModelBuilder) {
    beginLoading();
    let resources = scenes.get(model);
    if (!resources) {
      resources = createViewerScene(
        renderer,
        model,
        build,
        invalidate,
        environment?.texture
      );
      scenes.set(model, resources);
    }
    const camera = createViewerCamera({
      model,
      canvas,
      onChange: invalidate,
      onView,
    });
    cameraController?.dispose();
    cameraController = camera;
    sceneResources = resources;
    modelId = model;
    headphones = "hd-800s";
    scenes.delete(model);
    scenes.set(model, resources);
    // 現在と直前の製品だけを保持し、全製品のGPU資源が蓄積するのを防ぐ。
    if (scenes.size > sceneCacheLimit) {
      const [oldest] = scenes;
      if (oldest) {
        scenes.delete(oldest[0]);
        upgraded.delete(oldest[0]);
        oldest[1].dispose();
      }
    }
    camera.setInteractive(interactive);
    if (width > 0 && height > 0) {
      camera.resize(width / height);
    }
  }

  async function selectHeadphones(selected: HeadphoneModel) {
    if (disposed || selected === headphones || !sceneResources) {
      return;
    }
    const resources = sceneResources;
    const previous = headphones;
    headphones = selected;
    const attempt = beginLoading();
    try {
      await resources.setHeadphones(selected);
      if (
        !disposed &&
        attempt === preparation &&
        resources === sceneResources
      ) {
        await prepare();
      }
    } catch {
      if (!disposed && attempt === preparation) {
        headphones = previous;
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
    for (const resources of scenes.values()) {
      resources.dispose();
    }
    scenes.clear();
    environment?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };

  try {
    environment = createViewerEnvironment(renderer);
    activateModel(initialModel, createModel);
    renderLoop = createViewerRenderLoop({
      container,
      resize(nextWidth, nextHeight) {
        width = nextWidth;
        height = nextHeight;
        renderer.setSize(width, height, false);
        cameraController?.resize(width / height);
      },
      render() {
        if (
          !prepared ||
          disposed ||
          contextLost ||
          !sceneResources ||
          !cameraController
        ) {
          return;
        }
        try {
          if (sceneResources.updateDetail(cameraController.camera, height)) {
            void prepare();
            return;
          }
          renderer.render(sceneResources.scene, cameraController.camera);
          if (!ready) {
            ready = true;
            onStatus("ready");
            if (!upgraded.has(modelId)) {
              upgraded.add(modelId);
              void upgradeTextures(modelId);
            }
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
      setModel(model, build) {
        if (disposed || modelId === model) {
          return;
        }
        activateModel(model, build);
        void prepare();
      },
      setHeadphones(selected) {
        void selectHeadphones(selected);
      },
      setView(view) {
        cameraController?.setView(view);
      },
      zoom(direction) {
        cameraController?.zoom(direction);
      },
      setInteractive(enabled) {
        interactive = enabled;
        cameraController?.setInteractive(enabled);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
