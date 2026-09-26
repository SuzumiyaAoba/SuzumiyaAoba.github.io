import {
  ConeGeometry,
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, polyline, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";

const RADIUS = 2;
const CENTER = new Vector3(0, 2.2, 0);
const STEPS = 12;
const SAMPLES = 90;
const FORWARD = new Vector3(0, 0, 1);

type Method = "euler" | "nlerp" | "slerp";
const methods: readonly Method[] = ["euler", "nlerp", "slerp"];
const colors: Record<Method, string> = {
  euler: palette.coral,
  nlerp: palette.amber,
  slerp: palette.cyan,
};

function interpolate(
  method: Method,
  from: Euler,
  to: Euler,
  t: number,
  out: Quaternion
) {
  if (method === "euler") {
    return out.setFromEuler(
      new Euler(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
        from.z + (to.z - from.z) * t
      )
    );
  }
  const a = new Quaternion().setFromEuler(from);
  const b = new Quaternion().setFromEuler(to);
  if (method === "slerp") {
    return out.slerpQuaternions(a, b, t);
  }
  // nlerp：成分ごとに線形補間して正規化（最短経路になるよう符号をそろえる）
  const sign = a.dot(b) < 0 ? -1 : 1;
  return out
    .set(
      a.x + (b.x * sign - a.x) * t,
      a.y + (b.y * sign - a.y) * t,
      a.z + (b.z * sign - a.z) * t,
      a.w + (b.w * sign - a.w) * t
    )
    .normalize();
}

export const demo: DemoModule = {
  alt: "宇宙船の向きを 2 つの姿勢の間で補間するデモ。オイラー角をそのまま補間すると先端が遠回りの曲がった経路を通り、球面線形補間（Slerp）では最短の大円に沿って一定の角速度で回る。等間隔の t の位置が球面上の点で示される。",
  camera: { position: [5.2, 4.6, 6.2], target: [0, 2.1, 0] },
  controls: [
    {
      type: "select",
      key: "method",
      label: "宇宙船に使う補間",
      value: "slerp",
      options: [
        { value: "euler", label: "オイラー角を lerp" },
        { value: "nlerp", label: "nlerp" },
        { value: "slerp", label: "slerp" },
      ],
    },
    {
      type: "range",
      key: "duration",
      label: "回転にかける時間",
      min: 0.8,
      max: 5,
      step: 0.1,
      value: 2.4,
      format: (value) => `${value.toFixed(1)} 秒`,
    },
    { type: "button", key: "randomize", label: "新しい目標の向き" },
  ],
  legend: [
    { color: palette.coral, label: "オイラー角の lerp" },
    { color: palette.amber, label: "nlerp（正規化 lerp）" },
    { color: palette.cyan, label: "slerp" },
  ],
  hint: "球面上の点は t を 1/12 ずつ進めたときの先端の位置です。間隔が均一なのは slerp だけです。",
  setup(context) {
    const { scene, params } = context;
    const random = rng(11);
    const from = new Euler(0.2, -0.4, 0.1);
    const to = new Euler(-1.1, 2.5, 1.2);

    const globe = new Mesh(
      new SphereGeometry(RADIUS, 64, 48),
      new MeshStandardMaterial({
        color: "#6d86b0",
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      })
    );
    globe.position.copy(CENTER);
    const wire = new Mesh(
      new SphereGeometry(RADIUS, 24, 16),
      new MeshStandardMaterial({
        color: "#6d86b0",
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      })
    );
    wire.position.copy(CENTER);
    scene.add(globe, wire);

    const ship = new Group();
    const hull = new Mesh(
      new ConeGeometry(0.28, 1.1, 24),
      standard("#d9dee7", { metalness: 0.5, roughness: 0.3 })
    );
    hull.rotation.x = Math.PI / 2;
    const finMaterial = standard(palette.cyan, { emissive: 0.3 });
    for (const side of [-1, 1]) {
      const fin = new Mesh(new ConeGeometry(0.16, 0.6, 3), finMaterial);
      fin.rotation.set(Math.PI / 2, 0, (side * Math.PI) / 2);
      fin.position.set(side * 0.3, 0, -0.3);
      ship.add(fin);
    }
    const nose = new Mesh(
      new SphereGeometry(0.06, 12, 8),
      standard(palette.amber, { emissive: 2 })
    );
    nose.position.z = 0.55;
    ship.add(hull, nose);
    ship.position.copy(CENTER);
    ship.traverse((child) => {
      child.castShadow = true;
    });
    scene.add(ship);

    const paths = methods.map((method) => {
      const line = polyline([], colors[method], {
        width: method === "slerp" ? 3 : 2,
      });
      scene.add(line);
      return line;
    });
    const ticks = methods.map((method) => {
      const mesh = new InstancedMesh(
        new SphereGeometry(0.05, 12, 8),
        standard(colors[method], { emissive: 0.8 }),
        STEPS + 1
      );
      scene.add(mesh);
      return mesh;
    });
    const endLabels = [
      context.label("開始", { tone: "muted" }),
      context.label("目標", { tone: "muted" }),
    ];
    scene.add(...endLabels);
    const q = new Quaternion();
    const tip = new Vector3();
    const matrix = new Matrix4();
    let clock = 0;
    let dirty = true;

    const tipOf = (method: Method, t: number, out: Vector3) => {
      interpolate(method, from, to, t, q);
      return out
        .copy(FORWARD)
        .applyQuaternion(q)
        .multiplyScalar(RADIUS)
        .add(CENTER);
    };

    return {
      action(key) {
        if (key === "randomize") {
          from.copy(to);
          to.set(
            (random() - 0.5) * 2.8,
            (random() - 0.5) * 6,
            (random() - 0.5) * 2.8
          );
          clock = 0;
          dirty = true;
        }
      },
      update({ dt }) {
        if (dirty) {
          dirty = false;
          for (const [index, method] of methods.entries()) {
            const points: Vector3[] = [];
            for (let sample = 0; sample <= SAMPLES; sample++) {
              points.push(tipOf(method, sample / SAMPLES, new Vector3()));
            }
            paths[index]?.setPoints(points);
            const mesh = ticks[index];
            if (mesh) {
              for (let step = 0; step <= STEPS; step++) {
                tipOf(method, step / STEPS, tip);
                matrix.makeTranslation(tip.x, tip.y, tip.z);
                mesh.setMatrixAt(step, matrix);
              }
              mesh.instanceMatrix.needsUpdate = true;
            }
          }
          endLabels[0]?.position
            .copy(tipOf("slerp", 0, new Vector3()))
            .add(new Vector3(0, 0.25, 0));
          endLabels[1]?.position
            .copy(tipOf("slerp", 1, new Vector3()))
            .add(new Vector3(0, 0.25, 0));
        }
        const duration = Number(params["duration"]);
        clock += dt;
        const cycle = duration * 2 + 1.2;
        const local = clock % cycle;
        const t =
          local < duration
            ? local / duration
            : local < duration + 0.6
              ? 1
              : local < duration * 2 + 0.6
                ? 1 - (local - duration - 0.6) / duration
                : 0;
        const method =
          methods.find((item) => item === params["method"]) ?? "slerp";
        interpolate(method, from, to, t, ship.quaternion);
        for (const [index, item] of methods.entries()) {
          const line = paths[index];
          if (line) {
            line.material.opacity = item === method ? 1 : 0.45;
            line.material.transparent = true;
          }
        }
        const a = new Quaternion().setFromEuler(from);
        const b = new Quaternion().setFromEuler(to);
        context.readout(
          "2 姿勢の間の角度",
          `${((a.angleTo(b) * 180) / Math.PI).toFixed(1)}°`
        );
        context.readout("t", t.toFixed(2));
        context.caption(
          method === "slerp"
            ? "slerp：四元数を 4 次元の単位球上で大円に沿って補間。最短の回転を一定の角速度でたどる。"
            : method === "nlerp"
              ? "nlerp：成分を直線補間して正規化。経路は同じ大円だが、中央ほど速く端ほど遅い。"
              : "オイラー角の補間：3 つの角度を別々に動かすので、先端が遠回りの経路を描き、途中で不自然にねじれる。"
        );
      },
    };
  },
};
