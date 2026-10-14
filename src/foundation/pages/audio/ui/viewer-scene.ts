import {
  DirectionalLight,
  HemisphereLight,
  Material,
  Mesh,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
} from "three";
import type { WebGLRenderer } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { AudioModel, HeadphoneModel } from "../model/viewer";
import type { AudioModelBuilder } from "./viewer-model-loader";

export function createViewerScene(
  renderer: WebGLRenderer,
  modelId: AudioModel,
  createModel: AudioModelBuilder,
  onChange?: () => void
) {
  const scene = new Scene();
  const system = modelId === "system";
  const detailedHeadphones = modelId === "hd-800s";
  const detailedPortable = modelId === "sigma-pro";
  const earphones = modelId === "ie-600";
  const room = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity =
    detailedHeadphones || detailedPortable || earphones ? 0.72 : 1;
  pmrem.dispose();
  room.dispose();

  const model = createModel(onChange);
  scene.add(model.group);
  model.group.traverse((part) => {
    if (part instanceof Mesh && part.material instanceof Material) {
      part.castShadow =
        !part.material.transparent && part.userData["castShadow"] !== false;
      part.receiveShadow =
        system ||
        detailedHeadphones ||
        earphones ||
        modelId === "ha-1a-mk2" ||
        modelId === "sigma-pro";
    }
  });
  scene.add(
    new HemisphereLight(
      0xff_ff_ff,
      0x6a_73_7e,
      detailedHeadphones || detailedPortable || earphones ? 0.8 : 2.2
    )
  );
  const key = new DirectionalLight(
    detailedHeadphones ? 0xff_f8_ef : 0xff_ff_ff,
    detailedHeadphones ? 3.6 : detailedPortable ? 2.7 : 3
  );
  key.position.set(
    system ? -450 : -150,
    system ? 700 : 430,
    system ? 450 : 260
  );
  key.castShadow = true;
  const shadowSize =
    detailedHeadphones || detailedPortable || earphones || system ? 2048 : 1024;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  key.shadow.camera.left = system ? -750 : detailedPortable ? -110 : -250;
  key.shadow.camera.right = system ? 750 : detailedPortable ? 110 : 250;
  key.shadow.camera.top = system ? 550 : detailedPortable ? 130 : 230;
  key.shadow.camera.bottom = system ? -550 : detailedPortable ? -130 : -230;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = system ? 1800 : 900;
  key.shadow.normalBias = detailedHeadphones
    ? 0.08
    : detailedPortable
      ? 0.025
      : 0.4;
  key.shadow.radius = 4;
  if (earphones) {
    key.position.set(-70, 145, 115);
    key.shadow.camera.left = -110;
    key.shadow.camera.right = 110;
    key.shadow.camera.top = 110;
    key.shadow.camera.bottom = -110;
    key.shadow.camera.far = 500;
    key.shadow.normalBias = 0.015;
    key.target.position.set(0, 18, 10);
    scene.add(key.target);
    const rim = new DirectionalLight(0xe5_ee_ff, 1.4);
    rim.position.set(80, 85, -85);
    scene.add(rim);
  }
  scene.add(key);
  if (detailedHeadphones) {
    key.target.position.set(0, 145, 0);
    scene.add(key.target);
    const rim = new DirectionalLight(0xe5_ee_ff, 2.3);
    rim.position.set(-220, 320, -250);
    scene.add(rim);
  }
  const fill = new DirectionalLight(
    0xdc_e6_ff,
    detailedHeadphones || detailedPortable || earphones ? 0.8 : 1.1
  );
  fill.position.set(300, 100, -250);
  scene.add(fill);
  const undersideFill = new DirectionalLight(
    0xe6_ee_fc,
    detailedHeadphones || detailedPortable || earphones ? 0.5 : 1.8
  );
  undersideFill.position.set(0, -250, 50);
  scene.add(undersideFill);
  const floorGeometry = new PlaneGeometry(
    system ? 2500 : 1500,
    system ? 2500 : 1500
  );
  const floorMaterial = new ShadowMaterial({ opacity: 0.09 });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  return {
    scene,
    setHeadphones(selected: HeadphoneModel) {
      model.setHeadphones?.(selected);
    },
    dispose() {
      model.dispose();
      environment.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      key.shadow.dispose();
    },
  };
}
