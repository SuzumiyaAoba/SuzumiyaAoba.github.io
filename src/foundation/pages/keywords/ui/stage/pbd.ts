import { BufferAttribute, BufferGeometry, Vector3 } from "three";

export type DistanceConstraint = {
  a: number;
  b: number;
  rest: number;
  /** XPBD のコンプライアンス（硬さの逆数、0 で伸びない）。 */
  compliance: number;
  lambda: number;
  kind: number;
};

/**
 * 位置ベース物理（PBD / XPBD）の点と距離拘束。
 * 1. 速度で位置を予測 → 2. 拘束を満たすよう位置を補正 → 3. 位置の変化から速度を求め直す。
 */
export class ParticleSystem {
  readonly count: number;
  readonly positions: Float32Array;
  readonly previous: Float32Array;
  readonly velocities: Float32Array;
  readonly inverseMass: Float32Array;
  readonly constraints: DistanceConstraint[] = [];

  constructor(count: number) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.previous = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.inverseMass = new Float32Array(count).fill(1);
  }

  get(index: number, target: Vector3) {
    return target.fromArray(this.positions, index * 3);
  }

  set(index: number, position: Vector3) {
    position.toArray(this.positions, index * 3);
    position.toArray(this.previous, index * 3);
    this.velocities.fill(0, index * 3, index * 3 + 3);
  }

  connect(a: number, b: number, compliance = 0, kind = 0) {
    const ax = this.positions[a * 3] ?? 0;
    const ay = this.positions[a * 3 + 1] ?? 0;
    const az = this.positions[a * 3 + 2] ?? 0;
    const rest = Math.hypot(
      (this.positions[b * 3] ?? 0) - ax,
      (this.positions[b * 3 + 1] ?? 0) - ay,
      (this.positions[b * 3 + 2] ?? 0) - az
    );
    this.constraints.push({ a, b, rest, compliance, lambda: 0, kind });
  }

  /** 1. 重力などで速度を更新し、位置を予測する。 */
  predict(
    dt: number,
    gravity: number,
    damping = 0,
    force?: (index: number, out: Vector3) => void
  ) {
    const extra = new Vector3();
    for (let index = 0; index < this.count; index++) {
      const i3 = index * 3;
      this.previous[i3] = this.positions[i3] ?? 0;
      this.previous[i3 + 1] = this.positions[i3 + 1] ?? 0;
      this.previous[i3 + 2] = this.positions[i3 + 2] ?? 0;
      if ((this.inverseMass[index] ?? 0) === 0) {
        continue;
      }
      extra.set(0, 0, 0);
      force?.(index, extra);
      const keep = 1 - damping;
      this.velocities[i3] = ((this.velocities[i3] ?? 0) + extra.x * dt) * keep;
      this.velocities[i3 + 1] =
        ((this.velocities[i3 + 1] ?? 0) + (extra.y - gravity) * dt) * keep;
      this.velocities[i3 + 2] =
        ((this.velocities[i3 + 2] ?? 0) + extra.z * dt) * keep;
      this.positions[i3] =
        (this.positions[i3] ?? 0) + (this.velocities[i3] ?? 0) * dt;
      this.positions[i3 + 1] =
        (this.positions[i3 + 1] ?? 0) + (this.velocities[i3 + 1] ?? 0) * dt;
      this.positions[i3 + 2] =
        (this.positions[i3 + 2] ?? 0) + (this.velocities[i3 + 2] ?? 0) * dt;
    }
    for (const constraint of this.constraints) {
      constraint.lambda = 0;
    }
  }

  /**
   * 2. 距離拘束を 1 回ずつ解く。
   * mode = "pbd"：stiffness（0〜1）の割合だけ補正する。反復回数や時間刻みで硬さが変わる。
   * mode = "xpbd"：コンプライアンスと λ（累積した力）で補正量を決める。反復回数によらず同じ硬さになる。
   */
  solveDistances(
    dt: number,
    mode: "pbd" | "xpbd",
    stiffness = 1,
    filter?: (constraint: DistanceConstraint) => boolean
  ) {
    const p = this.positions;
    for (const constraint of this.constraints) {
      if (filter && !filter(constraint)) {
        continue;
      }
      const { a, b } = constraint;
      const wa = this.inverseMass[a] ?? 0;
      const wb = this.inverseMass[b] ?? 0;
      const w = wa + wb;
      if (w === 0) {
        continue;
      }
      const dx = (p[a * 3] ?? 0) - (p[b * 3] ?? 0);
      const dy = (p[a * 3 + 1] ?? 0) - (p[b * 3 + 1] ?? 0);
      const dz = (p[a * 3 + 2] ?? 0) - (p[b * 3 + 2] ?? 0);
      const length = Math.hypot(dx, dy, dz);
      if (length < 1e-9) {
        continue;
      }
      const c = length - constraint.rest;
      let delta = 0;
      if (mode === "pbd") {
        delta = (-c / w) * stiffness;
      } else {
        const alpha = constraint.compliance / (dt * dt);
        const deltaLambda = (-c - alpha * constraint.lambda) / (w + alpha);
        constraint.lambda += deltaLambda;
        delta = deltaLambda;
      }
      const nx = dx / length;
      const ny = dy / length;
      const nz = dz / length;
      p[a * 3] = (p[a * 3] ?? 0) + nx * delta * wa;
      p[a * 3 + 1] = (p[a * 3 + 1] ?? 0) + ny * delta * wa;
      p[a * 3 + 2] = (p[a * 3 + 2] ?? 0) + nz * delta * wa;
      p[b * 3] = (p[b * 3] ?? 0) - nx * delta * wb;
      p[b * 3 + 1] = (p[b * 3 + 1] ?? 0) - ny * delta * wb;
      p[b * 3 + 2] = (p[b * 3 + 2] ?? 0) - nz * delta * wb;
    }
  }

  /** 球の外へ押し出す（衝突の拘束）。 */
  collideSphere(center: Vector3, radius: number) {
    const p = this.positions;
    for (let index = 0; index < this.count; index++) {
      if ((this.inverseMass[index] ?? 0) === 0) {
        continue;
      }
      const dx = (p[index * 3] ?? 0) - center.x;
      const dy = (p[index * 3 + 1] ?? 0) - center.y;
      const dz = (p[index * 3 + 2] ?? 0) - center.z;
      const distance = Math.hypot(dx, dy, dz);
      if (distance < radius && distance > 1e-6) {
        const scale = radius / distance;
        p[index * 3] = center.x + dx * scale;
        p[index * 3 + 1] = center.y + dy * scale;
        p[index * 3 + 2] = center.z + dz * scale;
      }
    }
  }

  collideFloor(y: number) {
    const p = this.positions;
    for (let index = 0; index < this.count; index++) {
      if ((p[index * 3 + 1] ?? 0) < y) {
        p[index * 3 + 1] = y;
      }
    }
  }

  /** 3. 補正後の位置と予測前の位置の差から、速度を求め直す。 */
  updateVelocities(dt: number) {
    for (let index = 0; index < this.count * 3; index++) {
      this.velocities[index] =
        ((this.positions[index] ?? 0) - (this.previous[index] ?? 0)) / dt;
    }
  }

  /** 拘束の長さが元の長さから最大でどれだけ伸びたか（割合）。 */
  maxStretch(kind?: number) {
    let stretch = 0;
    const p = this.positions;
    for (const constraint of this.constraints) {
      if (kind !== undefined && constraint.kind !== kind) {
        continue;
      }
      const { a, b } = constraint;
      const length = Math.hypot(
        (p[a * 3] ?? 0) - (p[b * 3] ?? 0),
        (p[a * 3 + 1] ?? 0) - (p[b * 3 + 1] ?? 0),
        (p[a * 3 + 2] ?? 0) - (p[b * 3 + 2] ?? 0)
      );
      stretch = Math.max(stretch, length / constraint.rest - 1);
    }
    return stretch;
  }
}

/** 格子状の布（columns × rows 個の点）のジオメトリ。点の並びと頂点の並びをそろえる。 */
export function clothGeometry(columns: number, rows: number) {
  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(
    new Float32Array(columns * rows * 3),
    3
  );
  geometry.setAttribute("position", positionAttribute);
  const uvs = new Float32Array(columns * rows * 2);
  const indices: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      uvs[(j * columns + i) * 2] = i / (columns - 1);
      uvs[(j * columns + i) * 2 + 1] = 1 - j / (rows - 1);
      if (i < columns - 1 && j < rows - 1) {
        const a = j * columns + i;
        const b = a + 1;
        const c = a + columns;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const update = (positions: Float32Array) => {
    positionAttribute.copyArray(positions);
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  };
  return Object.assign(geometry, { update });
}
