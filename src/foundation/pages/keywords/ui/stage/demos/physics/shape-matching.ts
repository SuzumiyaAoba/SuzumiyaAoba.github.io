import {
  BoxGeometry,
  BufferAttribute,
  IcosahedronGeometry,
  Matrix3,
  Mesh,
  MeshPhysicalMaterial,
  Quaternion,
  TorusGeometry,
  TorusKnotGeometry,
  Vector3,
} from "three";
import type { BufferGeometry } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { palette, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const GRAVITY = 9.81;
const STEPS = [
  { x: 1.6, width: 1.6, height: 0.5 },
  { x: 3.2, width: 1.6, height: 1 },
];

type Blob = {
  mesh: Mesh<BufferGeometry, MeshPhysicalMaterial>;
  rest: Float32Array; // 重心を原点にした元の形
  positions: Float32Array;
  velocities: Float32Array;
  goals: Float32Array;
  count: number;
  aqqInverse: Matrix3;
  rotation: Quaternion;
  start: Vector3;
};

function createBlob(
  source: BufferGeometry,
  color: string,
  start: Vector3
): Blob {
  source.deleteAttribute("normal");
  source.deleteAttribute("uv");
  const geometry = mergeVertices(source);
  source.dispose();
  const attribute = geometry.getAttribute("position");
  const { count } = attribute;
  const rest = new Float32Array(count * 3);
  const center = new Vector3();
  for (let i = 0; i < count; i++) {
    center.x += attribute.getX(i) / count;
    center.y += attribute.getY(i) / count;
    center.z += attribute.getZ(i) / count;
  }
  // 元の形の共分散 Aqq = Σ q qᵀ（線形変形モードで使う）
  const aqq = new Matrix3().set(0, 0, 0, 0, 0, 0, 0, 0, 0);
  const e = aqq.elements;
  for (let i = 0; i < count; i++) {
    const q = [
      attribute.getX(i) - center.x,
      attribute.getY(i) - center.y,
      attribute.getZ(i) - center.z,
    ];
    rest.set(q, i * 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        e[c * 3 + r] = (e[c * 3 + r] ?? 0) + (q[r] ?? 0) * (q[c] ?? 0);
      }
    }
  }
  const mesh = new Mesh(
    geometry,
    new MeshPhysicalMaterial({
      color,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      transmission: 0.25,
      thickness: 1,
    })
  );
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  return {
    mesh,
    rest,
    positions: new Float32Array(count * 3),
    velocities: new Float32Array(count * 3),
    goals: new Float32Array(count * 3),
    count,
    aqqInverse: aqq.invert(),
    rotation: new Quaternion(),
    start,
  };
}

const columns = [new Vector3(), new Vector3(), new Vector3()] as const;
const rotated = [new Vector3(), new Vector3(), new Vector3()] as const;
const omega = new Vector3();
const cross = new Vector3();
const stepRotation = new Quaternion();

/**
 * 変形行列 A から回転 R だけを取り出す（Müller らの反復法）。
 * 前のフレームの回転 q から始め、R の各列が A の各列に重なる向きへ少しずつ回す。
 */
function extractRotation(a: Matrix3, q: Quaternion) {
  a.extractBasis(columns[0], columns[1], columns[2]);
  for (let iteration = 0; iteration < 12; iteration++) {
    rotated[0].set(1, 0, 0).applyQuaternion(q);
    rotated[1].set(0, 1, 0).applyQuaternion(q);
    rotated[2].set(0, 0, 1).applyQuaternion(q);
    omega.set(0, 0, 0);
    let denominator = 1e-9;
    for (const [c, column] of columns.entries()) {
      const r = rotated[c] ?? column;
      omega.add(cross.crossVectors(r, column));
      denominator += r.dot(column);
    }
    omega.divideScalar(Math.abs(denominator));
    const angle = omega.length();
    if (angle < 1e-9) {
      break;
    }
    stepRotation.setFromAxisAngle(omega.divideScalar(angle), angle);
    q.premultiply(stepRotation).normalize();
  }
  return q;
}

export const demo: DemoModule = {
  alt: "ゼリーのような柔らかい塊を、シェイプマッチングで動かすデモ。各点は自由に動くが、毎ステップ「元の形をいちばんよく重ねられる回転と位置」を求め、その重ねた形（目標の形）へ向かって引き戻される。ばねを 1 本も使わないのに、階段に落とすとつぶれて弾み、元の形に戻る。",
  camera: { position: [0.5, 4, 9], target: [0.8, 1, 0] },
  controls: [
    { type: "button", key: "drop", label: "落とす" },
    {
      type: "range",
      key: "stiffness",
      label: "形に戻る強さ α",
      min: 0.02,
      max: 1,
      step: 0.01,
      value: 0.25,
      hint: "1 で完全な剛体、小さいほどぷるぷる柔らかくなります。",
    },
    {
      type: "select",
      key: "mode",
      label: "目標の形",
      value: "rigid",
      options: [
        { value: "rigid", label: "回転だけ（剛体の形）" },
        { value: "linear", label: "伸び縮みも許す（線形）" },
      ],
    },
    { type: "toggle", key: "goals", label: "目標の形を表示", value: false },
  ],
  legend: [
    { color: palette.cyan, label: "目標の形へ引き戻す向き" },
    { color: palette.ink, label: "地面をクリック：つつく" },
  ],
  hint: "地面をクリックすると、その近くの塊を下からつつきます。",
  setup(context) {
    const { scene, params } = context;
    const blobs = [
      createBlob(
        new IcosahedronGeometry(0.75, 9),
        "#6fb3ff",
        new Vector3(-2.2, 3, 0)
      ),
      createBlob(
        new TorusGeometry(0.55, 0.25, 16, 40),
        "#f5a35c",
        new Vector3(0.6, 4.2, 0.2)
      ),
      createBlob(
        new TorusKnotGeometry(0.45, 0.16, 120, 12),
        "#c792ea",
        new Vector3(3, 5, -0.2)
      ),
    ];
    for (const blob of blobs) {
      scene.add(blob.mesh);
    }
    for (const stair of STEPS) {
      const box = new Mesh(
        new BoxGeometry(stair.width, stair.height, 3),
        standard("#566076", { roughness: 0.6 })
      );
      box.position.set(stair.x, stair.height / 2, 0);
      box.receiveShadow = true;
      box.castShadow = true;
      scene.add(box);
    }
    const goalLines = segments([], palette.cyan, { width: 1 });
    scene.add(goalLines);

    const drop = () => {
      for (const [index, blob] of blobs.entries()) {
        const spin = new Quaternion().setFromAxisAngle(
          new Vector3(1, 0.5, 0.2).normalize(),
          0.7 + index
        );
        const p = new Vector3();
        for (let i = 0; i < blob.count; i++) {
          p.fromArray(blob.rest, i * 3)
            .applyQuaternion(spin)
            .add(blob.start);
          p.toArray(blob.positions, i * 3);
        }
        blob.velocities.fill(0);
        blob.rotation.copy(spin);
      }
    };
    drop();

    context.onPick((point) => {
      for (const blob of blobs) {
        for (let i = 0; i < blob.count; i++) {
          const dx = (blob.positions[i * 3] ?? 0) - point.x;
          const dz = (blob.positions[i * 3 + 2] ?? 0) - point.z;
          const falloff = Math.max(0, 1 - Math.hypot(dx, dz) / 1.4);
          blob.velocities[i * 3 + 1] =
            (blob.velocities[i * 3 + 1] ?? 0) + falloff * 9;
        }
      }
    });

    const apq = new Matrix3();
    const deformation = new Matrix3();
    const center = new Vector3();
    const q = new Vector3();
    const p = new Vector3();
    const goal = new Vector3();

    const collide = (i3: number, blob: Blob) => {
      const pos = blob.positions;
      const vel = blob.velocities;
      if ((pos[i3 + 1] ?? 0) < 0) {
        pos[i3 + 1] = 0;
        vel[i3 + 1] = Math.max(0, vel[i3 + 1] ?? 0);
        vel[i3] = (vel[i3] ?? 0) * 0.8;
        vel[i3 + 2] = (vel[i3 + 2] ?? 0) * 0.8;
      }
      for (const stair of STEPS) {
        const x = pos[i3] ?? 0;
        const y = pos[i3 + 1] ?? 0;
        const left = stair.x - stair.width / 2;
        const right = stair.x + stair.width / 2;
        if (
          x > left &&
          x < right &&
          y < stair.height &&
          Math.abs(pos[i3 + 2] ?? 0) < 1.5
        ) {
          // いちばん浅い向きへ押し出す
          const toTop = stair.height - y;
          const toLeft = x - left;
          const toRight = right - x;
          if (toTop <= toLeft && toTop <= toRight) {
            pos[i3 + 1] = stair.height;
            vel[i3 + 1] = Math.max(0, vel[i3 + 1] ?? 0);
            vel[i3] = (vel[i3] ?? 0) * 0.8;
          } else if (toLeft < toRight) {
            pos[i3] = left;
            vel[i3] = Math.min(0, vel[i3] ?? 0);
          } else {
            pos[i3] = right;
            vel[i3] = Math.max(0, vel[i3] ?? 0);
          }
        }
      }
    };

    const step = (blob: Blob, h: number, alpha: number, linear: boolean) => {
      const { count, positions: pos, velocities: vel, rest, goals } = blob;
      // 1. 今の重心
      center.set(0, 0, 0);
      for (let i = 0; i < count; i++) {
        center.x += (pos[i * 3] ?? 0) / count;
        center.y += (pos[i * 3 + 1] ?? 0) / count;
        center.z += (pos[i * 3 + 2] ?? 0) / count;
      }
      // 2. Apq = Σ (x − c)(x₀ − c₀)ᵀ：今の形と元の形の対応
      const a = apq.set(0, 0, 0, 0, 0, 0, 0, 0, 0).elements;
      for (let i = 0; i < count; i++) {
        p.fromArray(pos, i * 3).sub(center);
        q.fromArray(rest, i * 3);
        const pv = [p.x, p.y, p.z];
        const qv = [q.x, q.y, q.z];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            a[c * 3 + r] = (a[c * 3 + r] ?? 0) + (pv[r] ?? 0) * (qv[c] ?? 0);
          }
        }
      }
      // 3. いちばんよく重なる回転 R を取り出す
      extractRotation(apq, blob.rotation);
      if (linear) {
        // 線形モード：A = Apq · Aqq⁻¹ を体積が変わらないよう正規化し、回転と混ぜる
        deformation.multiplyMatrices(apq, blob.aqqInverse);
        const det = deformation.determinant();
        if (det > 1e-6) {
          deformation.multiplyScalar(1 / Math.cbrt(det));
        }
      }
      // 4. 目標の形 g = R q + c へ向けて速度を加える
      for (let i = 0; i < count; i++) {
        q.fromArray(rest, i * 3);
        goal.copy(q).applyQuaternion(blob.rotation);
        if (linear) {
          const stretched = q.clone().applyMatrix3(deformation);
          goal.lerp(stretched, 0.5);
        }
        goal.add(center);
        goal.toArray(goals, i * 3);
        for (let axis = 0; axis < 3; axis++) {
          const i3 = i * 3 + axis;
          const pull = ((goals[i3] ?? 0) - (pos[i3] ?? 0)) * (alpha / h);
          vel[i3] =
            (vel[i3] ?? 0) + pull * 0.5 + (axis === 1 ? -GRAVITY * h : 0);
          vel[i3] = (vel[i3] ?? 0) * 0.995;
        }
      }
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3] = (pos[i3] ?? 0) + (vel[i3] ?? 0) * h;
        pos[i3 + 1] = (pos[i3 + 1] ?? 0) + (vel[i3 + 1] ?? 0) * h;
        pos[i3 + 2] = (pos[i3 + 2] ?? 0) + (vel[i3 + 2] ?? 0) * h;
        collide(i3, blob);
      }
    };

    return {
      action(key) {
        if (key === "drop") {
          drop();
        }
      },
      update({ dt }) {
        const alpha = Number(params["stiffness"]);
        const linear = params["mode"] === "linear";
        const substeps = 6;
        if (dt > 0) {
          for (let s = 0; s < substeps; s++) {
            for (const blob of blobs) {
              step(blob, dt / substeps, alpha, linear);
            }
          }
        }
        const showGoals = params["goals"] === true;
        const goalPoints: Vector3[] = [];
        for (const blob of blobs) {
          const attribute = blob.mesh.geometry.getAttribute("position");
          if (attribute instanceof BufferAttribute) {
            attribute.copyArray(blob.positions);
            attribute.needsUpdate = true;
          }
          blob.mesh.geometry.computeVertexNormals();
          blob.mesh.material.opacity = showGoals ? 0.5 : 1;
          blob.mesh.material.transparent = showGoals;
          if (showGoals) {
            for (let i = 0; i < blob.count; i += 3) {
              goalPoints.push(
                new Vector3().fromArray(blob.positions, i * 3),
                new Vector3().fromArray(blob.goals, i * 3)
              );
            }
          }
        }
        goalLines.visible = showGoals;
        if (showGoals) {
          goalLines.setPoints(goalPoints);
        }
        context.readout("点の数", blobs.map((blob) => blob.count).join(" / "));
        context.caption(
          "点同士はつながっていない。毎ステップ、今の点の並びに元の形をいちばんよく重ねる回転と位置を求め（最小二乗法）、その重ねた形へ各点を引き戻すだけ。つぶれても必ず元の形へ戻ろうとするので、ばねの網より安定で、どんな形にもそのまま使える。"
        );
      },
    };
  },
};
