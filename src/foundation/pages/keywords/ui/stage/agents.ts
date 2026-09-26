import {
  Color,
  ConeGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import type { BufferGeometry, ColorRepresentation } from "three";
import { standard } from "./kit";

const forward = new Vector3(0, 0, 1);

/** 進行方向（+Z）へ尖った、群れや敵を表す小さな矢じり形。 */
export function arrowheadGeometry(length = 0.36, width = 0.14): BufferGeometry {
  const geometry = new ConeGeometry(width, length, 4);
  geometry.rotateX(Math.PI / 2);
  geometry.scale(1, 0.45, 1);
  return geometry;
}

/**
 * 多数のエージェントをまとめて描く。
 * set(index, position, velocity) で位置と向きを更新し、commit() で反映する。
 */
export function crowd(
  count: number,
  color: ColorRepresentation,
  options: { geometry?: BufferGeometry; emissive?: number } = {}
) {
  const mesh = new InstancedMesh(
    options.geometry ?? arrowheadGeometry(),
    standard(color, { roughness: 0.45, emissive: options.emissive ?? 0.15 }),
    count
  );
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  const matrix = new Matrix4();
  const rotation = new Quaternion();
  const direction = new Vector3();
  const unit = new Vector3(1, 1, 1);
  const tint = new Color();
  const set = (
    index: number,
    position: Vector3,
    velocity: Vector3,
    scale = 1
  ) => {
    if (velocity.lengthSq() > 1e-8) {
      direction.copy(velocity).normalize();
      rotation.setFromUnitVectors(forward, direction);
    }
    matrix.compose(position, rotation, unit.setScalar(scale));
    mesh.setMatrixAt(index, matrix);
  };
  const paint = (index: number, value: ColorRepresentation) => {
    mesh.setColorAt(index, tint.set(value));
  };
  const commit = () => {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  };
  return Object.assign(mesh, { set, paint, commit });
}

/** 2 次元（xz 平面）の操舵で使う、長さの上限を付ける処理。 */
export function limit(vector: Vector3, max: number) {
  const length = vector.length();
  if (length > max) {
    vector.multiplyScalar(max / length);
  }
  return vector;
}
