import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
} from "three";
import type { WebGLRenderer } from "three";

export function createViewerEnvironment(renderer: WebGLRenderer) {
  const studio = new Scene();
  studio.background = new Color(0x64_67_6c);
  const geometry = new PlaneGeometry(1, 1);
  const materials: MeshBasicMaterial[] = [];
  // 広いソフトボックスと細い反射板で、曲面・面取り・旋盤目を読み取れる反射を作る。
  // 同じ照明を使い、全製品に共通の撮影条件を適用する。
  for (const { position, size, intensity } of [
    { position: [-4, 3, 5], size: [4, 6], intensity: 4.5 },
    { position: [0, 6, 0], size: [7, 5], intensity: 3 },
    { position: [5, 1.5, 1], size: [1.8, 6], intensity: 3.5 },
    { position: [0, 2, -5], size: [6, 3], intensity: 2.5 },
    { position: [0, -4, 0], size: [12, 12], intensity: 0.22 },
  ] as const) {
    const material = new MeshBasicMaterial();
    material.color.setRGB(intensity, intensity, intensity);
    materials.push(material);
    const panel = new Mesh(geometry, material);
    panel.position.set(position[0], position[1], position[2]);
    panel.scale.set(size[0], size[1], 1);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  }
  const pmrem = new PMREMGenerator(renderer);
  try {
    return pmrem.fromScene(studio, 0.035);
  } finally {
    pmrem.dispose();
    geometry.dispose();
    for (const material of materials) {
      material.dispose();
    }
  }
}
