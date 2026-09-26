import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Vector3,
} from "three";
import { palette, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const N = 5;
const SIZE = 1.4;
const MASS = 0.04;
const GRAVITY = 9.81;
const STRUCTURAL = 0;
const SHEAR = 1;
const BEND = 2;
const BUMP = { x: 0.3, z: 0, radius: 0.5, height: 0.6 };

type Spring = { a: number; b: number; rest: number; kind: number };

type Jelly = {
  positions: Float32Array;
  velocities: Float32Array;
  springs: Spring[];
  mesh: Mesh<BoxGeometry, MeshPhysicalMaterial>;
  vertexMap: Int32Array;
  offset: Vector3;
  color: string;
};

function createJelly(offset: Vector3, color: string): Jelly {
  const count = N * N * N;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const id = (i: number, j: number, k: number) => (k * N + j) * N + i;
  const springs: Spring[] = [];
  const place = () => {
    for (let k = 0; k < N; k++) {
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const index = id(i, j, k);
          positions[index * 3] = offset.x + (i / (N - 1) - 0.5) * SIZE;
          positions[index * 3 + 1] = offset.y + (j / (N - 1)) * SIZE;
          positions[index * 3 + 2] = offset.z + (k / (N - 1) - 0.5) * SIZE;
        }
      }
    }
  };
  place();
  const connect = (a: number, b: number, kind: number) => {
    const rest = Math.hypot(
      (positions[a * 3] ?? 0) - (positions[b * 3] ?? 0),
      (positions[a * 3 + 1] ?? 0) - (positions[b * 3 + 1] ?? 0),
      (positions[a * 3 + 2] ?? 0) - (positions[b * 3 + 2] ?? 0)
    );
    springs.push({ a, b, rest, kind });
  };
  for (let k = 0; k < N; k++) {
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const a = id(i, j, k);
        for (let dk = -1; dk <= 1; dk++) {
          for (let dj = -1; dj <= 1; dj++) {
            for (let di = -1; di <= 1; di++) {
              const ni = i + di;
              const nj = j + dj;
              const nk = k + dk;
              const b = id(ni, nj, nk);
              if (
                ni < 0 ||
                nj < 0 ||
                nk < 0 ||
                ni >= N ||
                nj >= N ||
                nk >= N ||
                b <= a
              ) {
                continue;
              }
              const manhattan = Math.abs(di) + Math.abs(dj) + Math.abs(dk);
              // 隣（構造）と、斜め（せん断）のばね
              connect(a, b, manhattan === 1 ? STRUCTURAL : SHEAR);
            }
          }
        }
        // 1 つ飛ばしの点（曲げ）のばね
        for (const [di, dj, dk] of [
          [2, 0, 0],
          [0, 2, 0],
          [0, 0, 2],
        ] as const) {
          if (i + di < N && j + dj < N && k + dk < N) {
            connect(a, id(i + di, j + dj, k + dk), BEND);
          }
        }
      }
    }
  }
  // 表示用の箱：頂点を、同じ位置にある点に対応づける
  const geometry = new BoxGeometry(SIZE, SIZE, SIZE, N - 1, N - 1, N - 1);
  geometry.translate(0, SIZE / 2, 0);
  const vertices = geometry.getAttribute("position");
  const vertexMap = new Int32Array(vertices.count);
  for (let v = 0; v < vertices.count; v++) {
    const i = Math.round((vertices.getX(v) / SIZE + 0.5) * (N - 1));
    const j = Math.round((vertices.getY(v) / SIZE) * (N - 1));
    const k = Math.round((vertices.getZ(v) / SIZE + 0.5) * (N - 1));
    vertexMap[v] = id(i, j, k);
  }
  const mesh = new Mesh(
    geometry,
    new MeshPhysicalMaterial({
      color,
      roughness: 0.18,
      transmission: 0.35,
      thickness: 1.2,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
    })
  );
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  return { positions, velocities, springs, mesh, vertexMap, offset, color };
}

export const demo: DemoModule = {
  alt: "点（質点）をばねでつないだゼリーの立方体を、床と出っ張りの上に落とすデモ。5×5×5 個の点を、隣同士・斜め・1 つ飛ばしの 3 種類のばねでつなぎ、ばねの伸び縮みから力を計算して動かす。斜めのばねを外すと、立方体は横からの力で簡単につぶれてしまう。",
  camera: { position: [3.2, 3.6, 7], target: [-0.6, 0.9, 0] },
  controls: [
    { type: "button", key: "drop", label: "落とす" },
    {
      type: "range",
      key: "stiffness",
      label: "ばね定数",
      min: 20,
      max: 600,
      step: 5,
      value: 70,
    },
    {
      type: "range",
      key: "damping",
      label: "ばねの減衰",
      min: 0,
      max: 1.5,
      step: 0.01,
      value: 0.06,
    },
    {
      type: "toggle",
      key: "shear",
      label: "斜め（せん断）のばね",
      value: true,
    },
    {
      type: "toggle",
      key: "bend",
      label: "1 つ飛ばし（曲げ）のばね",
      value: true,
    },
    { type: "toggle", key: "springs", label: "ばねを表示", value: false },
  ],
  legend: [
    { color: palette.amber, label: "構造のばね（隣同士）" },
    { color: palette.sky, label: "せん断のばね（斜め）" },
    { color: palette.violet, label: "曲げのばね（1 つ飛ばし）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const jellies = [
      createJelly(new Vector3(0.1, 2.6, 0.1), "#f06f8b"),
      createJelly(new Vector3(-2.9, 3.8, -1.3), "#63c7a4"),
    ];
    for (const jelly of jellies) {
      scene.add(jelly.mesh);
    }
    const bump = new Mesh(
      new CylinderGeometry(BUMP.radius, BUMP.radius, BUMP.height, 32),
      standard("#6b7385", { roughness: 0.5 })
    );
    bump.position.set(BUMP.x, BUMP.height / 2, BUMP.z);
    bump.castShadow = true;
    bump.receiveShadow = true;
    scene.add(bump);
    const lines = [
      segments([], palette.amber, { width: 1.2 }),
      segments([], palette.sky, { width: 1, opacity: 0.6 }),
      segments([], palette.violet, { width: 1, opacity: 0.6 }),
    ];
    scene.add(...lines);

    const drop = () => {
      for (const [index, jelly] of jellies.entries()) {
        const angle = 0.5 + index * 0.7;
        const axis = new Vector3(1, 0.4, 0.3).normalize();
        const p = new Vector3();
        for (let q = 0; q < jelly.positions.length / 3; q++) {
          const i = q % N;
          const j = Math.floor(q / N) % N;
          const k = Math.floor(q / (N * N));
          p.set(
            (i / (N - 1) - 0.5) * SIZE,
            (j / (N - 1) - 0.5) * SIZE,
            (k / (N - 1) - 0.5) * SIZE
          ).applyAxisAngle(axis, angle);
          jelly.positions[q * 3] = jelly.offset.x + p.x;
          jelly.positions[q * 3 + 1] = jelly.offset.y + p.y;
          jelly.positions[q * 3 + 2] = jelly.offset.z + p.z;
        }
        jelly.velocities.fill(0);
      }
    };
    drop();

    const forces = new Float32Array(N * N * N * 3);
    const step = (
      jelly: Jelly,
      dt: number,
      stiffness: number,
      damping: number,
      useShear: boolean,
      useBend: boolean
    ) => {
      const { positions: p, velocities: v } = jelly;
      forces.fill(0);
      for (let index = 0; index < N * N * N; index++) {
        forces[index * 3 + 1] = -MASS * GRAVITY;
      }
      for (const spring of jelly.springs) {
        if (
          (spring.kind === SHEAR && !useShear) ||
          (spring.kind === BEND && !useBend)
        ) {
          continue;
        }
        const { a, b } = spring;
        const dx = (p[b * 3] ?? 0) - (p[a * 3] ?? 0);
        const dy = (p[b * 3 + 1] ?? 0) - (p[a * 3 + 1] ?? 0);
        const dz = (p[b * 3 + 2] ?? 0) - (p[a * 3 + 2] ?? 0);
        const length = Math.hypot(dx, dy, dz);
        if (length < 1e-6) {
          continue;
        }
        const nx = dx / length;
        const ny = dy / length;
        const nz = dz / length;
        // フックの法則（伸びに比例）＋ 減衰（伸びる速さに比例）
        const relative =
          ((v[b * 3] ?? 0) - (v[a * 3] ?? 0)) * nx +
          ((v[b * 3 + 1] ?? 0) - (v[a * 3 + 1] ?? 0)) * ny +
          ((v[b * 3 + 2] ?? 0) - (v[a * 3 + 2] ?? 0)) * nz;
        const k = spring.kind === BEND ? stiffness * 0.5 : stiffness;
        const f = k * (length - spring.rest) + damping * relative;
        forces[a * 3] = (forces[a * 3] ?? 0) + f * nx;
        forces[a * 3 + 1] = (forces[a * 3 + 1] ?? 0) + f * ny;
        forces[a * 3 + 2] = (forces[a * 3 + 2] ?? 0) + f * nz;
        forces[b * 3] = (forces[b * 3] ?? 0) - f * nx;
        forces[b * 3 + 1] = (forces[b * 3 + 1] ?? 0) - f * ny;
        forces[b * 3 + 2] = (forces[b * 3 + 2] ?? 0) - f * nz;
      }
      for (let index = 0; index < N * N * N; index++) {
        const i3 = index * 3;
        // 半陰的オイラー法：速度を先に更新して、新しい速度で位置を進める
        for (let axis = 0; axis < 3; axis++) {
          v[i3 + axis] =
            ((v[i3 + axis] ?? 0) + ((forces[i3 + axis] ?? 0) / MASS) * dt) *
            0.9995;
          p[i3 + axis] = (p[i3 + axis] ?? 0) + (v[i3 + axis] ?? 0) * dt;
        }
        // 床：めり込んだら押し戻し、摩擦で横の動きを弱める
        if ((p[i3 + 1] ?? 0) < 0) {
          p[i3 + 1] = 0;
          v[i3 + 1] = Math.max(0, v[i3 + 1] ?? 0);
          v[i3] = (v[i3] ?? 0) * 0.9;
          v[i3 + 2] = (v[i3 + 2] ?? 0) * 0.9;
        }
        // 円柱の出っ張り
        const rx = (p[i3] ?? 0) - BUMP.x;
        const rz = (p[i3 + 2] ?? 0) - BUMP.z;
        const radial = Math.hypot(rx, rz);
        const y = p[i3 + 1] ?? 0;
        if (radial < BUMP.radius && y < BUMP.height) {
          const pushSide = BUMP.radius - radial;
          const pushTop = BUMP.height - y;
          if (pushTop < pushSide) {
            p[i3 + 1] = BUMP.height;
            v[i3 + 1] = Math.max(0, v[i3 + 1] ?? 0);
          } else if (radial > 1e-6) {
            p[i3] = BUMP.x + (rx / radial) * BUMP.radius;
            p[i3 + 2] = BUMP.z + (rz / radial) * BUMP.radius;
          }
        }
      }
    };

    return {
      action(key) {
        if (key === "drop") {
          drop();
        }
      },
      update({ dt }) {
        const stiffness = Number(params["stiffness"]);
        const damping = Number(params["damping"]);
        const useShear = params["shear"] === true;
        const useBend = params["bend"] === true;
        const substeps = 24;
        if (dt > 0) {
          for (let s = 0; s < substeps; s++) {
            for (const jelly of jellies) {
              step(jelly, dt / substeps, stiffness, damping, useShear, useBend);
            }
          }
        }
        for (const jelly of jellies) {
          const vertices = jelly.mesh.geometry.getAttribute("position");
          for (let vertex = 0; vertex < vertices.count; vertex++) {
            const q = jelly.vertexMap[vertex] ?? 0;
            vertices.setXYZ(
              vertex,
              jelly.positions[q * 3] ?? 0,
              jelly.positions[q * 3 + 1] ?? 0,
              jelly.positions[q * 3 + 2] ?? 0
            );
          }
          vertices.needsUpdate = true;
          jelly.mesh.geometry.computeVertexNormals();
        }
        const showSprings = params["springs"] === true;
        for (const [kind, line] of lines.entries()) {
          const visible =
            showSprings &&
            (kind === STRUCTURAL ||
              (kind === SHEAR && useShear) ||
              (kind === BEND && useBend));
          line.visible = visible;
          if (!visible) {
            continue;
          }
          const points: Vector3[] = [];
          for (const jelly of jellies) {
            for (const spring of jelly.springs) {
              if (spring.kind === kind) {
                points.push(
                  new Vector3().fromArray(jelly.positions, spring.a * 3),
                  new Vector3().fromArray(jelly.positions, spring.b * 3)
                );
              }
            }
          }
          line.setPoints(points);
        }
        for (const jelly of jellies) {
          jelly.mesh.material.opacity = showSprings ? 0.35 : 1;
          jelly.mesh.material.transparent = showSprings;
        }
        const springCount = jellies[0]?.springs.length ?? 0;
        context.readout("1 個あたりの点", `${N * N * N}`);
        context.readout("1 個あたりのばね", `${springCount}`);
        context.caption(
          useShear
            ? "各ばねは、伸びれば両端の点を引き寄せ、縮めば押し離す（フックの法則）。隣同士のばねだけでは四角形が平行四辺形にひしゃげてしまうので、斜めのばねで形を支え、1 つ飛ばしのばねで折れ曲がりにくくしている。"
            : "斜めのばねがないと、四角形を平行四辺形にずらす変形に抵抗できず、ゼリーは横からの力で簡単につぶれてしまう。"
        );
      },
    };
  },
};
