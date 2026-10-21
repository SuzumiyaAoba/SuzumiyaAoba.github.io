import { Group, Mesh } from "three";
import type { Camera, Object3D, Scene, WebGLRenderer } from "three";

function isMesh(part: Object3D): part is Mesh {
  return part instanceof Mesh;
}

export async function prepareViewerShaders(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera
) {
  const visible = new Group();
  // compileAsync は非表示の部品も走査するため、表示対象だけを事前に準備する。
  // 形状・材質は共有し、実際のシーンの親子関係には触れない。
  scene.traverseVisible((part) => {
    if (isMesh(part)) {
      visible.add(part.clone(false));
    }
  });
  await renderer.compileAsync(visible, camera, scene);
}
