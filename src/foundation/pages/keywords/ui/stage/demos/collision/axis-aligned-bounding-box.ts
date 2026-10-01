import {
  BoxGeometry,
  Color,
  Euler,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

const COUNT = 16;
const BOUNDS = new Vector3(4.2, 1.6, 2.8);

type Body = {
  mesh: Mesh;
  material: MeshStandardMaterial;
  half: Vector3;
  velocity: Vector3;
  spin: Vector3;
  min: Vector3;
  max: Vector3;
};

const EDGES = [
  [0, 1],
  [1, 3],
  [3, 2],
  [2, 0],
  [4, 5],
  [5, 7],
  [7, 6],
  [6, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;

/** 回転した箱どうしの正確な判定（3 次元の分離軸：面の法線 6 本と辺の組 9 本）。 */
function obbOverlap(a: Body, b: Body) {
  const axesA = [0, 1, 2].map((i) =>
    new Vector3().setFromMatrixColumn(a.mesh.matrixWorld, i).normalize()
  );
  const axesB = [0, 1, 2].map((i) =>
    new Vector3().setFromMatrixColumn(b.mesh.matrixWorld, i).normalize()
  );
  const halfA = [a.half.x, a.half.y, a.half.z];
  const halfB = [b.half.x, b.half.y, b.half.z];
  const between = b.mesh.position.clone().sub(a.mesh.position);
  const candidates = [...axesA, ...axesB];
  for (const u of axesA) {
    for (const v of axesB) {
      const cross = u.clone().cross(v);
      if (cross.lengthSq() > 1e-8) {
        candidates.push(cross.normalize());
      }
    }
  }
  for (const axis of candidates) {
    let ra = 0;
    let rb = 0;
    for (let i = 0; i < 3; i++) {
      ra += (halfA[i] ?? 0) * Math.abs(axesA[i]?.dot(axis) ?? 0);
      rb += (halfB[i] ?? 0) * Math.abs(axesB[i]?.dot(axis) ?? 0);
    }
    if (Math.abs(between.dot(axis)) > ra + rb) {
      return false;
    }
  }
  return true;
}

export const demo: DemoModule = {
  alt: "物体を、座標軸に平行な箱（AABB）で囲んで、衝突の候補を素早く絞り込むデモ。回転しながら飛び回る 16 個の箱それぞれに、白い線の AABB を付ける。2 つの AABB が重なるかは、x・y・z の 3 本の軸で区間が重なるかを比べるだけで調べられる。AABB が重なった組（黄色の線）だけを、回転した箱どうしの正確な判定にかけ、本当に接触した箱を赤くする。回転に合わせて 8 つの角から AABB を作り直すとぴったり囲めるが、回転しても変わらない大きめの立方体で囲むと計算は要らない代わりに、重なりの候補が増える。",
  camera: {
    position: [0, 6.5, 9.5],
    target: [0, 1.4, 0],
    fov: 42,
    autoRotate: 4,
  },
  controls: [
    {
      type: "select",
      key: "fit",
      label: "AABB の作り方",
      value: "tight",
      options: [
        { value: "tight", label: "毎フレーム 8 つの角から作り直す" },
        { value: "loose", label: "回転しても変わらない立方体" },
      ],
    },
    {
      type: "range",
      key: "speed",
      label: "動く速さ",
      min: 0,
      max: 2,
      step: 0.1,
      value: 0.7,
    },
    { type: "toggle", key: "boxes", label: "AABB を表示", value: true },
  ],
  legend: [
    { color: palette.ink, label: "AABB（ほかと重なっていない）" },
    { color: palette.amber, label: "AABB が重なった（候補）" },
    { color: palette.coral, label: "箱どうしが本当に接触" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(13);
    const bodies: Body[] = Array.from({ length: COUNT }, () => {
      const half = new Vector3(
        0.2 + random() * 0.45,
        0.12 + random() * 0.3,
        0.15 + random() * 0.35
      );
      const material = new MeshStandardMaterial({
        color: "#8a97ab",
        roughness: 0.5,
      });
      const mesh = new Mesh(
        new BoxGeometry(half.x * 2, half.y * 2, half.z * 2),
        material
      );
      mesh.castShadow = true;
      mesh.position.set(
        (random() * 2 - 1) * BOUNDS.x,
        0.5 + random() * BOUNDS.y * 1.5,
        (random() * 2 - 1) * BOUNDS.z
      );
      mesh.quaternion.setFromEuler(
        new Euler(random() * 6, random() * 6, random() * 6)
      );
      scene.add(mesh);
      return {
        mesh,
        material,
        half,
        velocity: new Vector3(
          random() * 2 - 1,
          (random() * 2 - 1) * 0.4,
          random() * 2 - 1
        ).multiplyScalar(0.9),
        spin: new Vector3(
          random() * 2 - 1,
          random() * 2 - 1,
          random() * 2 - 1
        ).multiplyScalar(1.4),
        min: new Vector3(),
        max: new Vector3(),
      };
    });
    const idleLines = segments([], palette.ink, { width: 1.2, opacity: 0.55 });
    const hotLines = segments([], palette.amber, { width: 2.2 });
    scene.add(idleLines, hotLines);

    const corner = new Vector3();
    const delta = new Quaternion();
    const base = new Color("#8a97ab");
    const hit = new Color(palette.coral);
    const box = (body: Body) => {
      const { min, max } = body;
      const out: Vector3[] = [];
      const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
        (i) =>
          new Vector3(
            i & 1 ? max.x : min.x,
            i & 2 ? max.y : min.y,
            i & 4 ? max.z : min.z
          )
      );
      for (const [p, q] of EDGES) {
        out.push(corners[p] ?? min, corners[q] ?? max);
      }
      return out;
    };

    return {
      update({ dt }) {
        const speed = Number(params["speed"]);
        for (const body of bodies) {
          body.mesh.position.addScaledVector(body.velocity, dt * speed);
          for (const axis of ["x", "z"] as const) {
            if (Math.abs(body.mesh.position[axis]) > BOUNDS[axis]) {
              body.velocity[axis] *= -1;
              body.mesh.position[axis] =
                Math.sign(body.mesh.position[axis]) * BOUNDS[axis];
            }
          }
          if (
            body.mesh.position.y < 0.4 ||
            body.mesh.position.y > 0.4 + BOUNDS.y * 1.6
          ) {
            body.velocity.y *= -1;
            body.mesh.position.y = Math.min(
              0.4 + BOUNDS.y * 1.6,
              Math.max(0.4, body.mesh.position.y)
            );
          }
          delta.setFromEuler(
            new Euler(
              body.spin.x * dt * speed,
              body.spin.y * dt * speed,
              body.spin.z * dt * speed
            )
          );
          body.mesh.quaternion.multiply(delta);
          body.mesh.updateMatrixWorld();
          if (params["fit"] === "loose") {
            // 回転しても中身がはみ出さない立方体：半径 = 対角線の半分
            const radius = body.half.length();
            body.min.copy(body.mesh.position).subScalar(radius);
            body.max.copy(body.mesh.position).addScalar(radius);
          } else {
            body.min.set(Infinity, Infinity, Infinity);
            body.max.set(-Infinity, -Infinity, -Infinity);
            for (let i = 0; i < 8; i++) {
              corner
                .set(
                  i & 1 ? body.half.x : -body.half.x,
                  i & 2 ? body.half.y : -body.half.y,
                  i & 4 ? body.half.z : -body.half.z
                )
                .applyMatrix4(body.mesh.matrixWorld);
              body.min.min(corner);
              body.max.max(corner);
            }
          }
        }
        const overlapping = new Set<Body>();
        const touching = new Set<Body>();
        let candidates = 0;
        let contacts = 0;
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i];
            const b = bodies[j];
            if (!a || !b) {
              continue;
            }
            // AABB の重なり：3 本の軸すべてで区間が重なるか
            const aabb =
              a.min.x <= b.max.x &&
              a.max.x >= b.min.x &&
              a.min.y <= b.max.y &&
              a.max.y >= b.min.y &&
              a.min.z <= b.max.z &&
              a.max.z >= b.min.z;
            if (!aabb) {
              continue;
            }
            candidates++;
            overlapping.add(a);
            overlapping.add(b);
            if (obbOverlap(a, b)) {
              contacts++;
              touching.add(a);
              touching.add(b);
            }
          }
        }
        const idle: Vector3[] = [];
        const hot: Vector3[] = [];
        for (const body of bodies) {
          (overlapping.has(body) ? hot : idle).push(...box(body));
          body.material.color.copy(touching.has(body) ? hit : base);
        }
        const show = params["boxes"] === true;
        idleLines.setPoints(idle);
        hotLines.setPoints(hot);
        idleLines.visible = show && idle.length > 0;
        hotLines.visible = show && hot.length > 0;
        let volume = 0;
        let solid = 0;
        for (const body of bodies) {
          const size = body.max.clone().sub(body.min);
          volume += size.x * size.y * size.z;
          solid += body.half.x * body.half.y * body.half.z * 8;
        }
        const pairs = (COUNT * (COUNT - 1)) / 2;
        context.readout("全部の組", `${pairs}`);
        context.readout("AABB が重なった組（候補）", `${candidates}`);
        context.readout("本当に接触した組", `${contacts}`);
        context.readout(
          "AABB の体積 / 箱の体積",
          `${(volume / solid).toFixed(2)} 倍`
        );
        context.caption(
          params["fit"] === "loose"
            ? "回転しても中身がはみ出さない立方体で囲むと、回転のたびに作り直す必要がない。ただし箱よりずっと大きいので、AABB が重なる候補が増え、正確な判定を呼ぶ回数が増える。"
            : `AABB の重なりは、x・y・z の区間を比べる 6 回の比較だけで判定できる。${pairs} 組のうち、AABB が重なった組だけを正確な判定（分離軸）にかければよい。回転するたびに、8 つの角を変換して最小と最大を取り直すと、ぴったり囲める。`
        );
      },
    };
  },
};
