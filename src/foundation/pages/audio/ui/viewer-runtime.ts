import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  Material,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Spherical,
  SRGBColorSpace,
  TOUCH,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createUd505 } from "./scene/ud-505";
import { createCg10m } from "./scene/cg-10m";
import { createNodeN130 } from "./scene/node-n130";
import { createHd800s } from "./scene/hd-800s";
import { createClearMgPro } from "./scene/clear-mg-pro";
import { createHa1aMk2 } from "./scene/ha-1a-mk2";
import type {
  AudioModel,
  AudioView,
  ViewerHandle,
  ViewerStatus,
} from "./viewer-types";

type ViewerOptions = {
  model: AudioModel;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onStatus: (status: ViewerStatus) => void;
  onView: (view: AudioView | undefined) => void;
};

type CameraPose = {
  direction: readonly [number, number, number];
  target: readonly [number, number, number];
  width: number;
  height: number;
  depth: number;
};

const poses: Record<AudioView, CameraPose> = {
  dials: {
    direction: [0.65, 0.24, 1],
    target: [0, 83, 142],
    width: 130,
    height: 100,
    depth: 28,
  },
  tubes: {
    direction: [0, 0.02, 1],
    target: [0, 159, 141.5],
    width: 90,
    height: 90,
    depth: 12,
  },
  overview: {
    direction: [0.7, 0.44, 1],
    target: [0, 39, 0],
    width: 350,
    height: 230,
    depth: 140,
  },
  front: {
    direction: [0, 0, 1],
    target: [0, 42, 4],
    width: 315,
    height: 125,
    depth: 128,
  },
  rear: {
    direction: [0, 0.05, -1],
    target: [0, 42, -15],
    width: 315,
    height: 125,
    depth: 107,
  },
  top: {
    direction: [0, 1, 0.001],
    target: [0, 40, 0],
    width: 315,
    height: 280,
    depth: 44,
  },
  bottom: {
    direction: [0, -1, 0.001],
    target: [0, 40, 0],
    width: 315,
    height: 280,
    depth: 40,
  },
  headphones: {
    direction: [0.08, 0.12, 1],
    target: [25, 35, 113],
    width: 145,
    height: 85,
    depth: 22,
  },
  meter: {
    direction: [0.1, 0.08, 1],
    target: [0, 44.5, 113],
    width: 85,
    height: 70,
    depth: 12,
  },
  outputs: {
    direction: [0.08, 0.12, -1],
    target: [35, 32, -111],
    width: 190,
    height: 80,
    depth: 12,
  },
  controls: {
    direction: [0.02, 1, 0.28],
    target: [0, 45, 0],
    width: 170,
    height: 115,
    depth: 15,
  },
  connections: {
    direction: [0.06, 0.1, -1],
    target: [0, 25, -70],
    width: 215,
    height: 70,
    depth: 15,
  },
  side: {
    direction: [1, 0, 0.02],
    target: [0, 158, 0],
    width: 165,
    height: 305,
    depth: 110,
  },
  earpads: {
    direction: [1, 0.08, 0.7],
    target: [-82, 130, 0],
    width: 120,
    height: 150,
    depth: 30,
  },
  headband: {
    direction: [0.35, 0.65, 1],
    target: [0, 239, 0],
    width: 210,
    height: 135,
    depth: 45,
  },
  grille: {
    direction: [1, 0.12, 0.3],
    target: [82, 130, 0],
    width: 135,
    height: 165,
    depth: 40,
  },
};

const nodePoses: Partial<Record<AudioView, CameraPose>> = {
  overview: {
    direction: [0.65, 0.7, 1],
    target: [0, 22, 0],
    width: 270,
    height: 180,
    depth: 85,
  },
  front: {
    direction: [0, 0, 1],
    target: [0, 23, 0],
    width: 240,
    height: 80,
    depth: 80,
  },
  rear: {
    direction: [0, 0.05, -1],
    target: [0, 23, -4],
    width: 240,
    height: 85,
    depth: 75,
  },
  top: {
    direction: [0, 1, 0.001],
    target: [0, 23, 0],
    width: 245,
    height: 175,
    depth: 24,
  },
  bottom: {
    direction: [0, -1, 0.001],
    target: [0, 23, 0],
    width: 245,
    height: 175,
    depth: 24,
  },
  headphones: {
    direction: [0.1, 0.06, 1],
    target: [0, 10.2, 70.5],
    width: 55,
    height: 42,
    depth: 8,
  },
};

const hd800sPoses: Partial<Record<AudioView, CameraPose>> = {
  overview: {
    direction: [1, 0.32, 1.6],
    target: [0, 157, 0],
    width: 265,
    height: 305,
    depth: 85,
  },
  front: {
    direction: [0, 0, 1],
    target: [0, 157, 0],
    width: 265,
    height: 305,
    depth: 65,
  },
  rear: {
    direction: [0, 0, -1],
    target: [0, 157, 0],
    width: 265,
    height: 305,
    depth: 65,
  },
  top: {
    direction: [0, 1, 0.001],
    target: [0, 157, 0],
    width: 265,
    height: 180,
    depth: 140,
  },
};

const clearMgPoses: Partial<Record<AudioView, CameraPose>> = {
  overview: {
    direction: [1.3, 0.28, 1.35],
    target: [0, 117, 0],
    width: 245,
    height: 260,
    depth: 65,
  },
  front: {
    direction: [0, 0, 1],
    target: [0, 117, 0],
    width: 245,
    height: 260,
    depth: 45,
  },
  rear: {
    direction: [0, 0.04, -1],
    target: [0, 117, 0],
    width: 245,
    height: 260,
    depth: 45,
  },
  top: {
    direction: [0, 1, 0.001],
    target: [0, 117, 0],
    width: 250,
    height: 155,
    depth: 125,
  },
  side: {
    direction: [1, 0.025, 0.025],
    target: [75, 59, 0],
    width: 130,
    height: 160,
    depth: 12,
  },
  earpads: {
    direction: [1, 0.04, 1],
    target: [-35, 66, 0],
    width: 145,
    height: 150,
    depth: 35,
  },
  headband: {
    direction: [0.3, 0.45, 1],
    target: [0, 197, 0],
    width: 220,
    height: 135,
    depth: 35,
  },
  connections: {
    direction: [0.85, -1, 1],
    target: [75, 3, 0],
    width: 65,
    height: 65,
    depth: 18,
  },
};

const modelPoses: Partial<
  Record<AudioModel, Partial<Record<AudioView, CameraPose>>>
> = {
  "node-n130": nodePoses,
  "hd-800s": hd800sPoses,
  "clear-mg-pro": clearMgPoses,
  "ha-1a-mk2": {
    overview: {
      direction: [0.95, 0.45, 1.3],
      target: [0, 105, 0],
      width: 310,
      height: 290,
      depth: 90,
    },
    front: {
      direction: [0, 0, 1],
      target: [0, 107.5, 0],
      width: 160,
      height: 240,
      depth: 155,
    },
    rear: {
      direction: [0, 0, -1],
      target: [0, 107.5, 0],
      width: 160,
      height: 240,
      depth: 155,
    },
    side: {
      direction: [1, 0.03, 0],
      target: [0, 107.5, 0],
      width: 325,
      height: 240,
      depth: 65,
    },
    top: {
      direction: [0, 1, 0.001],
      target: [0, 107.5, 0],
      width: 160,
      height: 325,
      depth: 110,
    },
    bottom: {
      direction: [0, -1, 0.001],
      target: [0, 107.5, 0],
      width: 160,
      height: 325,
      depth: 110,
    },
    headphones: {
      direction: [0.05, 0.08, 1],
      target: [0, 52, 141.5],
      width: 118,
      height: 106,
      depth: 16,
    },
    connections: {
      direction: [0.08, 0.08, -1],
      target: [0, 153, -143],
      width: 115,
      height: 135,
      depth: 18,
    },
  },
};

const modelBuilders = {
  "ud-505": createUd505,
  "cg-10m": createCg10m,
  "node-n130": createNodeN130,
  "hd-800s": createHd800s,
  "clear-mg-pro": createClearMgPro,
  "ha-1a-mk2": createHa1aMk2,
} satisfies Record<AudioModel, () => ReturnType<typeof createUd505>>;

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

  const scene = new Scene();
  const detailedHeadphones = modelId === "hd-800s";
  const room = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = detailedHeadphones ? 0.72 : 1;
  pmrem.dispose();
  room.dispose();

  const model = modelBuilders[modelId]();
  scene.add(model.group);
  model.group.traverse((part) => {
    if (part instanceof Mesh && part.material instanceof Material) {
      part.castShadow = !part.material.transparent;
      part.receiveShadow = detailedHeadphones || modelId === "ha-1a-mk2";
    }
  });
  scene.add(
    new HemisphereLight(0xff_ff_ff, 0x6a_73_7e, detailedHeadphones ? 0.8 : 2.2)
  );
  const key = new DirectionalLight(
    detailedHeadphones ? 0xff_f8_ef : 0xff_ff_ff,
    detailedHeadphones ? 3.6 : 3
  );
  key.position.set(-150, 430, 260);
  key.castShadow = true;
  const shadowSize = detailedHeadphones ? 2048 : 1024;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  key.shadow.camera.left = -250;
  key.shadow.camera.right = 250;
  key.shadow.camera.top = 230;
  key.shadow.camera.bottom = -230;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 900;
  key.shadow.normalBias = detailedHeadphones ? 0.08 : 0.4;
  key.shadow.radius = 4;
  scene.add(key);
  if (detailedHeadphones) {
    key.target.position.set(0, 145, 0);
    scene.add(key.target);
    const rim = new DirectionalLight(0xe5_ee_ff, 2.3);
    rim.position.set(-220, 320, -250);
    scene.add(rim);
  }
  const fill = new DirectionalLight(0xdc_e6_ff, detailedHeadphones ? 0.8 : 1.1);
  fill.position.set(300, 100, -250);
  scene.add(fill);
  const undersideFill = new DirectionalLight(
    0xe6_ee_fc,
    detailedHeadphones ? 0.5 : 1.8
  );
  undersideFill.position.set(0, -250, 50);
  scene.add(undersideFill);
  const floorGeometry = new PlaneGeometry(1500, 1500);
  const floorMaterial = new ShadowMaterial({ opacity: 0.09 });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  const camera = new PerspectiveCamera(35, 1, 0.5, 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 65;
  controls.maxDistance = 1100;
  controls.minPolarAngle = 0.001;
  controls.maxPolarAngle = Math.PI - 0.001;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.7;
  controls.touches.TWO = TOUCH.DOLLY_ROTATE;
  controls.cursorStyle = "grab";

  let frame = 0;
  let visible = true;
  let disposed = false;
  let contextLost = false;
  let preset: AudioView | undefined = "overview";
  const invalidate = () => {
    if (frame || disposed || contextLost || !visible || document.hidden) {
      return;
    }
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (disposed || contextLost) {
        return;
      }
      renderer.render(scene, camera);
    });
  };
  controls.addEventListener("change", invalidate);
  const orbit = () => {
    preset = undefined;
    onView(undefined);
  };
  controls.addEventListener("start", orbit);

  const setView = (view: AudioView) => {
    preset = view;
    const pose = modelPoses[modelId]?.[view] ?? poses[view];
    camera.fov = view === "front" || view === "rear" ? 20 : 35;
    camera.updateProjectionMatrix();
    const halfFov = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const distance =
      Math.max(
        pose.width / (2 * halfFov * camera.aspect),
        pose.height / (2 * halfFov)
      ) *
        1.1 +
      pose.depth;
    controls.target.set(...pose.target);
    camera.position.copy(
      new Vector3(...pose.direction)
        .normalize()
        .multiplyScalar(distance)
        .add(controls.target)
    );
    controls.update();
    invalidate();
    onView(view);
  };

  const zoom = (direction: "in" | "out") => {
    orbit();
    const offset = camera.position.clone().sub(controls.target);
    const distance = MathUtils.clamp(
      offset.length() * (direction === "in" ? 0.82 : 1.22),
      controls.minDistance,
      controls.maxDistance
    );
    camera.position.copy(
      offset.normalize().multiplyScalar(distance).add(controls.target)
    );
    controls.update();
    invalidate();
  };

  const keyboard = (event: KeyboardEvent) => {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoom("in");
      return;
    }
    if (event.key === "-") {
      event.preventDefault();
      zoom("out");
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setView("overview");
      return;
    }
    const rotations: Record<string, readonly [number, number]> = {
      ArrowLeft: [-0.12, 0],
      ArrowRight: [0.12, 0],
      ArrowUp: [0, -0.12],
      ArrowDown: [0, 0.12],
    };
    const rotation = rotations[event.key];
    if (!rotation) {
      return;
    }
    event.preventDefault();
    orbit();
    const spherical = new Spherical().setFromVector3(
      camera.position.clone().sub(controls.target)
    );
    spherical.theta += rotation[0];
    spherical.phi = MathUtils.clamp(
      spherical.phi + rotation[1],
      0.001,
      Math.PI - 0.001
    );
    camera.position.copy(
      new Vector3().setFromSpherical(spherical).add(controls.target)
    );
    controls.update();
    invalidate();
  };
  canvas.addEventListener("keydown", keyboard);
  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) {
      return;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (preset) {
      setView(preset);
    }
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
    setView,
    zoom,
    setInteractive(enabled) {
      controls.enabled = enabled;
      canvas.style.touchAction = enabled ? "none" : "pan-y";
      canvas.style.cursor = enabled ? "grab" : "auto";
    },
    dispose() {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", invalidate);
      canvas.removeEventListener("keydown", keyboard);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      controls.removeEventListener("change", invalidate);
      controls.removeEventListener("start", orbit);
      controls.dispose();
      model.dispose();
      environment.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      key.shadow.dispose();
      renderer.dispose();
    },
  };
}
