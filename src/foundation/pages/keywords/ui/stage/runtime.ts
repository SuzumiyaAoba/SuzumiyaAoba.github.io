import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  ShaderMaterial,
  ShadowMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Object3D, Texture } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";
import { disposeObject, palette } from "./kit";
import type {
  DemoContext,
  DemoInstance,
  DemoModule,
  DemoParams,
  Vec3,
} from "./types";

type StageCallbacks = {
  onReadout: (values: readonly (readonly [string, string])[]) => void;
  onCaption: (text: string) => void;
  onParam: (key: string, value: number | boolean | string) => void;
};

export type StageHandle = {
  setPlaying: (playing: boolean) => void;
  setActive: (active: boolean) => void;
  setParam: (key: string, value: number | boolean | string) => void;
  action: (key: string) => void;
  resetCamera: () => void;
  restart: () => void;
  dispose: () => void;
};

const MAX_DT = 1 / 20;
const READOUT_INTERVAL = 120;

function backgroundTexture(top: string, bottom: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, top);
    gradient.addColorStop(0.55, bottom);
    gradient.addColorStop(1, bottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 16, 256);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** 距離で消えていく方眼の床。 */
function gridFloor() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new Color(palette.muted) },
      uFade: { value: 11 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld;
      uniform vec3 uColor;
      uniform float uFade;
      float gridLine(vec2 p, float scale) {
        vec2 coord = p / scale;
        vec2 derivative = fwidth(coord);
        vec2 g = abs(fract(coord - 0.5) - 0.5) / derivative;
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      void main() {
        float minor = gridLine(vWorld.xz, 0.5) * 0.12;
        float major = gridLine(vWorld.xz, 2.0) * 0.28;
        float fade = 1.0 - smoothstep(uFade * 0.35, uFade, length(vWorld.xz));
        float alpha = max(minor, major) * fade;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(uColor, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(new PlaneGeometry(60, 60), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = -1;
  return mesh;
}

const toVector = (value: Vec3 | undefined, fallback: Vec3) =>
  new Vector3(...(value ?? fallback));

export function createStage(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  labelLayer: HTMLElement,
  demo: DemoModule,
  params: DemoParams,
  callbacks: StageCallbacks
): StageHandle {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const labels = new CSS2DRenderer({ element: labelLayer });
  const hudRoot = document.createElement("div");
  hudRoot.className = "keyword-stage-hud-slot";
  const overlayRoot = document.createElement("div");
  overlayRoot.className = "keyword-stage-overlay-slot";
  labelLayer.append(overlayRoot, hudRoot);

  const scene = new Scene();
  const cameraOptions = demo.camera ?? { position: [4, 3, 6] as const };
  const camera = new PerspectiveCamera(cameraOptions.fov ?? 40, 1, 0.05, 200);
  const initialPosition = toVector(cameraOptions.position, [4, 3, 6]);
  const initialTarget = toVector(cameraOptions.target, [0, 0.5, 0]);
  camera.position.copy(initialPosition);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(resource: T) => {
    disposables.push(resource);
    return resource;
  };

  const studio =
    demo.studio === false
      ? undefined
      : typeof demo.studio === "object"
        ? demo.studio
        : {};
  let environment: Texture | undefined;
  if (studio) {
    const background = studio.background ?? palette.background;
    scene.background = track(
      backgroundTexture(palette.backgroundTop, background)
    );
    if (studio.fog ?? true) {
      scene.fog = new Fog(background, 14, 34);
    }
    const pmrem = new PMREMGenerator(renderer);
    environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = environment;
    scene.environmentIntensity = 0.25;
    const hemisphere = new HemisphereLight("#bcd4ff", "#1a1f2a", 0.55);
    const key = new DirectionalLight("#fff4e6", 1.6);
    key.position.set(5, 9, 4);
    key.castShadow = studio.shadows ?? true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.camera.far = 30;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    const rim = new DirectionalLight(palette.sky, 0.9);
    rim.position.set(-6, 4, -7);
    scene.add(hemisphere, key, rim);
    if (studio.floor ?? true) {
      const shadowCatcher = new Mesh(
        new PlaneGeometry(60, 60),
        new ShadowMaterial({ opacity: 0.32 })
      );
      shadowCatcher.rotation.x = -Math.PI / 2;
      shadowCatcher.position.y = -0.001;
      shadowCatcher.receiveShadow = true;
      scene.add(shadowCatcher, gridFloor());
    }
  } else {
    scene.background = new Color(palette.background);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(initialTarget);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minDistance = 1;
  controls.maxDistance = 40;
  controls.enabled = cameraOptions.orbit ?? true;
  controls.autoRotate = (cameraOptions.autoRotate ?? 0) !== 0;
  controls.autoRotateSpeed = (cameraOptions.autoRotate ?? 0) / 6;
  controls.update();
  // 1 本指の縦スクロールはページに渡し、2 本指で視点を操作する。
  canvas.style.touchAction = "pan-y";
  controls.touches = { ONE: null, TWO: 2 };

  const size = new Vector2(1, 1);
  const pointer = { ndc: new Vector2(), inside: false, down: false };
  const readouts = new Map<string, string>();
  const resizeHandlers: ((width: number, height: number) => void)[] = [];
  let customRender: (() => void) | null = null;
  let needsRender = true;

  const raycaster = new Raycaster();
  const hoverRaycaster = new Raycaster();
  const hoverPlane = new Plane();
  type Draggable = {
    object: Object3D;
    normal: Vector3;
    origin: Vec3 | undefined;
    clamp: ((position: Vector3) => unknown) | undefined;
    onDrag: ((position: Vector3) => unknown) | undefined;
  };
  const draggables: Draggable[] = [];
  type Picker = {
    handler: (point: Vector3) => void;
    normal: Vector3;
    origin: Vector3;
  };
  const pickers: Picker[] = [];

  const context: DemoContext = {
    scene,
    camera,
    renderer,
    canvas,
    params,
    pointer,
    size,
    readout: (label, value) => {
      if (value === "") {
        readouts.delete(label);
      } else {
        readouts.set(label, value);
      }
    },
    caption: (text) => callbacks.onCaption(text),
    setAutoRotate: (enabled) => {
      controls.autoRotate = enabled && (cameraOptions.autoRotate ?? 0) !== 0;
    },
    setParam: (key, value) => {
      params[key] = value;
      callbacks.onParam(key, value);
      needsRender = true;
    },
    label: (text, options = {}) => {
      const element = document.createElement("div");
      element.className = "keyword-stage-label";
      element.dataset["tone"] = options.tone ?? "strong";
      element.dataset["size"] = options.size ?? "sm";
      if (options.color) {
        element.style.setProperty("--label-color", options.color);
      }
      element.textContent = text;
      const object = new CSS2DObject(element);
      const setText = (next: string) => {
        if (element.textContent !== next) {
          element.textContent = next;
        }
      };
      return Object.assign(object, { setText });
    },
    hud: (element) => {
      hudRoot.append(element);
    },
    overlay: (element) => {
      overlayRoot.append(element);
    },
    setRender: (render) => {
      customRender = render;
    },
    onResize: (handler) => {
      resizeHandlers.push(handler);
    },
    draggable: (object, options) => {
      draggables.push({
        object,
        normal: toVector(options.normal, [0, 1, 0]).normalize(),
        origin: options.origin,
        clamp: options.clamp,
        onDrag: options.onDrag,
      });
    },
    onPick: (handler, plane = {}) => {
      pickers.push({
        handler,
        normal: toVector(plane.normal, [0, 1, 0]).normalize(),
        origin: toVector(plane.origin, [0, 0, 0]),
      });
    },
    pointerOnPlane: (options = {}, target = new Vector3()) => {
      if (!pointer.inside) {
        return null;
      }
      hoverRaycaster.setFromCamera(pointer.ndc, camera);
      hoverPlane.setFromNormalAndCoplanarPoint(
        toVector(options.normal, [0, 1, 0]).normalize(),
        toVector(options.origin, [0, 0, 0])
      );
      return hoverRaycaster.ray.intersectPlane(hoverPlane, target);
    },
    track,
  };

  let composer: EffectComposer | undefined;
  if (demo.bloom) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(
        new Vector2(256, 256),
        demo.bloom.strength ?? 0.8,
        demo.bloom.radius ?? 0.5,
        demo.bloom.threshold ?? 0.2
      )
    );
    composer.addPass(new OutputPass());
    track(composer);
  }

  const baseChildren = scene.children.length;
  const baseDisposables = disposables.length;
  let instance: DemoInstance = demo.setup(context);
  let time = 0;
  let previous = 0;
  let frame = 0;
  let playing = true;
  let active = false;
  let lastReadout = 0;
  let disposed = false;

  const render = () => {
    if (customRender) {
      customRender();
    } else if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
    labels.render(scene, camera);
  };

  const flushReadouts = (timestamp: number) => {
    if (timestamp - lastReadout < READOUT_INTERVAL) {
      return;
    }
    lastReadout = timestamp;
    callbacks.onReadout([...readouts.entries()]);
  };

  const tick = (timestamp: number) => {
    if (disposed || !active) {
      return;
    }
    frame = requestAnimationFrame(tick);
    const dt =
      previous === 0 ? 1 / 60 : Math.min(MAX_DT, (timestamp - previous) / 1000);
    previous = timestamp;
    const moved = controls.update(dt);
    if (playing) {
      time += dt;
      instance.update({ time, dt });
      needsRender = true;
    } else if (needsRender) {
      instance.update({ time, dt: 0 });
    }
    if (needsRender || moved) {
      render();
      needsRender = false;
    }
    flushReadouts(timestamp);
  };

  const start = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    if (active && !disposed) {
      frame = requestAnimationFrame(tick);
    }
  };

  controls.addEventListener("change", () => {
    needsRender = true;
  });

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    size.set(width, height);
    renderer.setSize(width, height, false);
    composer?.setPixelRatio(renderer.getPixelRatio());
    composer?.setSize(width, height);
    labels.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    for (const handler of resizeHandlers) {
      handler(width, height);
    }
    needsRender = true;
    if (!active) {
      render();
    }
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // ---- ポインター操作 ----
  const plane = new Plane();
  const hit = new Vector3();
  let dragging: Draggable | undefined;
  let downAt: { x: number; y: number } | undefined;

  const updatePointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.ndc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer.ndc, camera);
  };

  const findDraggable = () => {
    if (draggables.length === 0) {
      return;
    }
    const hits = raycaster.intersectObjects(
      draggables.map((item) => item.object),
      true
    );
    const [first] = hits;
    if (!first) {
      return;
    }
    return draggables.find((item) => {
      let current: Object3D | null = first.object;
      while (current) {
        if (current === item.object) {
          return true;
        }
        current = current.parent;
      }
      return false;
    });
  };

  const onPointerDown = (event: PointerEvent) => {
    updatePointer(event);
    pointer.down = true;
    downAt = { x: event.clientX, y: event.clientY };
    const target = findDraggable();
    if (target) {
      dragging = target;
      controls.enabled = false;
      canvas.setPointerCapture(event.pointerId);
      const origin = target.origin
        ? new Vector3(...target.origin)
        : target.object.getWorldPosition(new Vector3());
      plane.setFromNormalAndCoplanarPoint(target.normal, origin);
      canvas.style.cursor = "grabbing";
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    updatePointer(event);
    pointer.inside = true;
    needsRender = true;
    if (dragging) {
      if (raycaster.ray.intersectPlane(plane, hit)) {
        const local = dragging.object.parent
          ? dragging.object.parent.worldToLocal(hit.clone())
          : hit.clone();
        dragging.clamp?.(local);
        dragging.object.position.copy(local);
        dragging.onDrag?.(local);
        needsRender = true;
      }
      return;
    }
    if (event.pointerType === "mouse") {
      canvas.style.cursor = findDraggable()
        ? "grab"
        : pickers.length > 0
          ? "crosshair"
          : "";
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    pointer.down = false;
    if (dragging) {
      dragging = undefined;
      controls.enabled = cameraOptions.orbit ?? true;
      canvas.releasePointerCapture(event.pointerId);
      canvas.style.cursor = "";
      return;
    }
    const moved = downAt
      ? Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y)
      : 99;
    downAt = undefined;
    if (moved > 5 || pickers.length === 0) {
      return;
    }
    updatePointer(event);
    for (const picker of pickers) {
      plane.setFromNormalAndCoplanarPoint(picker.normal, picker.origin);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        picker.handler(hit.clone());
        needsRender = true;
      }
    }
  };

  const onPointerLeave = () => {
    pointer.inside = false;
    needsRender = true;
  };

  const onWheel = (event: WheelEvent) => {
    // 通常のスクロールはページに渡し、Ctrl/⌘（トラックパッドのピンチ）でのみズームする。
    if (!(event.ctrlKey || event.metaKey) || !(cameraOptions.orbit ?? true)) {
      return;
    }
    event.preventDefault();
    const offset = camera.position.clone().sub(controls.target);
    const scale = Math.exp(event.deltaY * 0.004);
    const distance = Math.min(
      controls.maxDistance,
      Math.max(controls.minDistance, offset.length() * scale)
    );
    offset.setLength(distance);
    camera.position.copy(controls.target).add(offset);
    needsRender = true;
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  const teardownInstance = () => {
    instance.dispose?.();
  };

  instance.update({ time: 0, dt: 0 });
  render();

  return {
    setPlaying: (next) => {
      playing = next;
      needsRender = true;
    },
    setActive: (next) => {
      active = next;
      start();
    },
    setParam: (key, value) => {
      params[key] = value;
      instance.change?.(key, value);
      needsRender = true;
    },
    action: (key) => {
      instance.action?.(key);
      needsRender = true;
    },
    resetCamera: () => {
      camera.position.copy(initialPosition);
      controls.target.copy(initialTarget);
      controls.update();
      needsRender = true;
    },
    restart: () => {
      time = 0;
      teardownInstance();
      // 以前のシーン要素を片付けてから作り直す。
      const keep = new Set(scene.children.slice(0, baseChildren));
      const added = scene.children.filter((child) => !keep.has(child));
      for (const child of added) {
        scene.remove(child);
        disposeObject(child);
      }
      for (const resource of disposables.splice(baseDisposables)) {
        resource.dispose();
      }
      hudRoot.replaceChildren();
      overlayRoot.replaceChildren();
      draggables.length = 0;
      pickers.length = 0;
      resizeHandlers.length = 0;
      customRender = null;
      readouts.clear();
      instance = demo.setup(context);
      resize();
      instance.update({ time: 0, dt: 0 });
      needsRender = true;
      if (!active) {
        render();
      }
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      teardownInstance();
      controls.dispose();
      disposeObject(scene);
      for (const resource of disposables) {
        resource.dispose();
      }
      environment?.dispose();
      labelLayer.replaceChildren();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
