import { PerspectiveCamera, Vector3 } from "three";
import type { BufferGeometry, Camera, Material, Mesh } from "three";

type DetailOptions = {
  radius: number;
  pixels: number;
  build: () => BufferGeometry;
  highMaterial?: Material;
  hideLow?: boolean;
};
type DetailPart = DetailOptions & {
  mesh: Mesh<BufferGeometry, Material>;
  lowGeometry: BufferGeometry;
  lowMaterial: Material;
  highGeometry?: BufferGeometry;
  high: boolean;
};

/** 画面上の大きさに応じ、必要になった高精細形状だけを生成する。 */
export function createDetailLevels() {
  const parts: DetailPart[] = [];
  const generated = new Set<BufferGeometry>();
  const center = new Vector3();
  const eye = new Vector3();
  const scale = new Vector3();
  let disposed = false;
  return {
    add(mesh: Mesh<BufferGeometry, Material>, options: DetailOptions) {
      mesh.userData["audioDynamicDetail"] = true;
      if (options.hideLow) {
        mesh.visible = false;
      }
      parts.push({
        ...options,
        mesh,
        lowGeometry: mesh.geometry,
        lowMaterial: mesh.material,
        high: false,
      });
      return mesh;
    },
    update(camera: Camera, viewportHeight: number) {
      if (
        disposed ||
        !(camera instanceof PerspectiveCamera) ||
        viewportHeight <= 0
      ) {
        return false;
      }
      camera.getWorldPosition(eye);
      const focalLength =
        viewportHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
      let changed = false;
      for (const part of parts) {
        center.setFromMatrixPosition(part.mesh.matrixWorld);
        scale.setFromMatrixScale(part.mesh.matrixWorld);
        const radius =
          part.radius *
          Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
        // 手前側の距離を使い、境界付近では早めに詳細へ切り替える。
        const distance = Math.max(eye.distanceTo(center) - radius, camera.near);
        const pixels = (2 * radius * focalLength) / distance;
        const threshold = part.pixels * (part.high ? 0.85 : 1);
        const high = pixels >= threshold;
        if (high === part.high) {
          continue;
        }
        if (high) {
          part.highGeometry ??= part.build();
          generated.add(part.highGeometry);
          part.mesh.geometry = part.highGeometry;
          part.mesh.material = part.highMaterial ?? part.lowMaterial;
          part.mesh.visible = true;
        } else {
          part.mesh.geometry = part.lowGeometry;
          part.mesh.material = part.lowMaterial;
          part.mesh.visible = !part.hideLow;
        }
        part.high = high;
        changed = true;
      }
      return changed;
    },
    dispose() {
      disposed = true;
      for (const geometry of generated) {
        geometry.dispose();
      }
      generated.clear();
      parts.length = 0;
    },
  };
}
