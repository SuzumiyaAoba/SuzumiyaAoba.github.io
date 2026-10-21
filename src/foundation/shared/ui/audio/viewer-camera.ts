import { MathUtils, PerspectiveCamera, Spherical, TOUCH, Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type {
  AudioModel,
  AudioView,
  ZoomDirection,
} from "@/shared/ui/audio/definitions/viewer";
import { getCameraPose } from "./viewer-camera-presets";

const keyboardRotations: Record<string, readonly [number, number]> = {
  ArrowLeft: [-0.12, 0],
  ArrowRight: [0.12, 0],
  ArrowUp: [0, -0.12],
  ArrowDown: [0, 0.12],
};

type CameraOptions = {
  model: AudioModel;
  canvas: HTMLCanvasElement;
  onChange: () => void;
  onView: (view: AudioView | undefined) => void;
};

export function createViewerCamera({
  model,
  canvas,
  onChange,
  onView,
}: CameraOptions) {
  const system = model === "system";
  const earphones = model === "ie-600";
  const portable = model === "btr17";
  const camera = new PerspectiveCamera(35, 1, 0.5, system ? 8000 : 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = earphones ? 8 : portable ? 12 : 65;
  controls.maxDistance = system ? 6000 : earphones || portable ? 650 : 1100;
  controls.minPolarAngle = 0.001;
  controls.maxPolarAngle = Math.PI - 0.001;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.7;
  controls.touches.TWO = TOUCH.DOLLY_ROTATE;
  controls.cursorStyle = "grab";

  let preset: AudioView | undefined = "overview";
  controls.addEventListener("change", onChange);
  const orbit = () => {
    preset = undefined;
    onView(undefined);
  };
  controls.addEventListener("start", orbit);

  const setView = (view: AudioView) => {
    preset = view;
    const pose = getCameraPose(model, view);
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
    onChange();
    onView(view);
  };

  const zoom = (direction: ZoomDirection) => {
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
    onChange();
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
    const rotation = keyboardRotations[event.key];
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
    onChange();
  };
  canvas.addEventListener("keydown", keyboard);

  const setInteractive = (enabled: boolean) => {
    controls.enabled = enabled;
    canvas.style.touchAction = enabled ? "none" : "pan-y";
    canvas.style.cursor = enabled ? "grab" : "auto";
  };

  return {
    camera,
    setView,
    zoom,
    resize(aspect: number) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      if (preset) {
        setView(preset);
      }
    },
    setInteractive,
    dispose() {
      canvas.removeEventListener("keydown", keyboard);
      controls.removeEventListener("change", onChange);
      controls.removeEventListener("start", orbit);
      controls.dispose();
    },
  };
}
