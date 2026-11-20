import { Frustum, Matrix4, PerspectiveCamera, Sphere, Vector3 } from "three";
import type { BufferGeometry, Camera, Material, Mesh } from "three";

type DetailOptions = {
  radius: number;
  pixels: number;
  center?: Vector3;
  build?: () => BufferGeometry;
  highMaterial?: Material;
  hideLow?: boolean;
};
type DetailPart = DetailOptions & {
  center: Vector3;
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
  const bounds = new Sphere();
  const origin = new Vector3();
  const viewCenter = new Vector3();
  const frustum = new Frustum();
  const viewProjection = new Matrix4();
  let disposed = false;
  return {
    add(mesh: Mesh<BufferGeometry, Material>, options: DetailOptions) {
      mesh.userData["audioDynamicDetail"] = true;
      if (options.hideLow) {
        mesh.visible = false;
      }
      parts.push({
        ...options,
        center: options.center ?? origin,
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
      camera.updateWorldMatrix(true, false);
      frustum.setFromProjectionMatrix(
        viewProjection.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse
        )
      );
      const focalLength =
        (viewportHeight * camera.projectionMatrix.elements[5]) / 2;
      let changed = false;
      for (const part of parts) {
        bounds.center.copy(part.center);
        bounds.radius = part.radius;
        bounds.applyMatrix4(part.mesh.matrixWorld);
        if (!frustum.intersectsSphere(bounds)) {
          continue;
        }
        viewCenter.copy(bounds.center).applyMatrix4(camera.matrixWorldInverse);
        // 手前側の距離を使い、境界付近では早めに詳細へ切り替える。
        const distance = Math.max(-viewCenter.z - bounds.radius, camera.near);
        const pixels = (2 * bounds.radius * focalLength) / distance;
        const threshold = part.pixels * (part.high ? 0.85 : 1);
        const high = pixels >= threshold;
        if (high === part.high) {
          continue;
        }
        if (high) {
          if (part.build) {
            part.highGeometry ??= part.build();
            generated.add(part.highGeometry);
            part.mesh.geometry = part.highGeometry;
          }
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
