import {
  Box3,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Sphere,
  Vector3,
} from "three";
import type { WebGLRenderer, Object3D } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { AudioModel, HeadphoneModel } from "../model/viewer";
import type { AudioModelBuilder } from "./viewer-model-loader";

function isMesh(part: Object3D): part is Mesh {
  return part instanceof Mesh;
}

function configureModelShadows(group: Object3D) {
  group.traverse((part) => {
    if (!isMesh(part)) {
      return;
    }
    const materials = Array.isArray(part.material)
      ? part.material
      : [part.material];
    part.castShadow =
      part.userData["castShadow"] !== false &&
      materials.some(
        (material) => !material.transparent || material.alphaTest > 0
      );
    part.receiveShadow = true;
  });
}

export function createViewerScene(
  renderer: WebGLRenderer,
  modelId: AudioModel,
  createModel: AudioModelBuilder,
  onChange?: () => void
) {
  const scene = new Scene();
  const room = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.72;
  pmrem.dispose();
  room.dispose();

  let initialized = false;
  const model = createModel(refresh);
  scene.add(model.group);

  // 全製品を同じ撮影環境に置き、照明範囲だけを実寸に合わせる。
  const bounds = new Box3().setFromObject(model.group);
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const span = Math.max(size.x, size.y, size.z, 50);
  scene.add(new HemisphereLight(0xff_ff_ff, 0x56_5b_66, 0.75));
  const key = new DirectionalLight(0xff_f9_f2, 3.1);
  key.position.copy(center).add(new Vector3(-span * 0.75, span * 1.5, span));
  key.target.position.copy(center);
  key.castShadow = true;
  // 視点を動かしても光源と模型は動かないため、影は内容変更時だけ再計算する。
  key.shadow.autoUpdate = false;
  key.shadow.mapSize.set(2048, 2048);
  const shadowExtent = bounds.getBoundingSphere(new Sphere()).radius * 1.08;
  key.shadow.camera.left = -shadowExtent;
  key.shadow.camera.right = shadowExtent;
  key.shadow.camera.top = shadowExtent;
  key.shadow.camera.bottom = -shadowExtent;
  key.shadow.camera.near = span * 0.2;
  key.shadow.camera.far = span * 4;
  key.shadow.normalBias = Math.max(0.008, span * 0.00012);
  key.shadow.bias = -0.00005;
  key.shadow.radius = 3;
  scene.add(key, key.target);

  const fill = new DirectionalLight(0xe4_ed_ff, 0.7);
  fill.position.copy(center).add(new Vector3(span, span * 0.4, span * 0.35));
  fill.target.position.copy(center);
  const rim = new DirectionalLight(0xec_f2_ff, 1.6);
  rim.position.copy(center).add(new Vector3(span * 0.3, span, -span));
  rim.target.position.copy(center);
  const underside = new DirectionalLight(0xe6_eb_f5, 0.4);
  underside.position.copy(center).add(new Vector3(0, -span, span * 0.3));
  underside.target.position.copy(center);
  scene.add(fill, fill.target, rim, rim.target, underside, underside.target);

  const floorGeometry = new PlaneGeometry(span * 5, span * 5);
  const floorMaterial = new ShadowMaterial({
    opacity: modelId === "system" ? 0.12 : 0.16,
  });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(center.x, -0.5, center.z);
  floor.receiveShadow = true;
  scene.add(floor);

  function refresh() {
    if (!initialized) {
      return;
    }
    configureModelShadows(model.group);
    scene.updateMatrixWorld(true);
    key.shadow.needsUpdate = true;
    onChange?.();
  }
  initialized = true;
  refresh();
  // 静的な模型・床・照明の行列を毎フレーム巡回し直さない。
  scene.matrixWorldAutoUpdate = false;

  return {
    scene,
    refresh,
    setHeadphones: (selected: HeadphoneModel) => {
      if (model.setHeadphones) {
        model.setHeadphones(selected);
        refresh();
      }
    },
    dispose() {
      initialized = false;
      model.dispose();
      environment.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      key.shadow.dispose();
    },
  };
}
