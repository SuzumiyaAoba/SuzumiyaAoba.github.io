import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";
import { oceanSurface, waterHeight, waveSet, waveUniforms } from "../../waves";

const GRAVITY = 9.81;
const WATER_DENSITY = 1000;
const MAX_SAMPLES = 4 * 27;

type BodySpec = {
  name: string;
  size: readonly [number, number, number];
  density: number;
  color: string;
  start: readonly [number, number, number];
};

const SPECS: readonly BodySpec[] = [
  {
    name: "小舟",
    size: [2.6, 0.45, 1.1],
    density: 320,
    color: "#b9794a",
    start: [-2.2, 1.5, -0.8],
  },
  {
    name: "木箱",
    size: [0.9, 0.9, 0.9],
    density: 600,
    color: "#caa472",
    start: [1.6, 2.5, 1.4],
  },
  {
    name: "丸太",
    size: [2.2, 0.55, 0.55],
    density: 600,
    color: "#8a6a4a",
    start: [2.2, 2, -1.2],
  },
  {
    name: "鉄の箱",
    size: [0.7, 0.7, 0.7],
    density: 2400,
    color: "#8c96a3",
    start: [-0.8, 3, 1.8],
  },
];

export const demo: DemoModule = {
  alt: "波の上に浮かぶ小舟や木箱、丸太、鉄の箱で浮力を確かめるデモ。物体の中にいくつかの点を置き、それぞれの点が水面より下にある分だけ上向きの力を加える。力は点ごとに別の場所にかかるので、傾いた物体は起き上がり、波に合わせて揺れる。水より重い鉄の箱は沈む。点が 1 つだけだと、浮き沈みはしても傾きは生まれない。",
  camera: { position: [6.5, 4.2, 7.5], target: [0, 0, 0] },
  studio: { floor: false, background: "#0d1a26" },
  controls: [
    { type: "button", key: "drop", label: "空から落とす" },
    {
      type: "select",
      key: "samples",
      label: "浮力を測る点",
      value: "3",
      options: [
        { value: "1", label: "中心の 1 点" },
        { value: "2", label: "2×2×2 点" },
        { value: "3", label: "3×3×3 点" },
      ],
    },
    {
      type: "range",
      key: "height",
      label: "波の高さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 1,
    },
    {
      type: "range",
      key: "drag",
      label: "水の抵抗",
      min: 0,
      max: 3,
      step: 0.05,
      value: 1,
      hint: "0 にすると、いつまでも上下に揺れ続けます。",
    },
    { type: "toggle", key: "forces", label: "点と浮力を表示", value: true },
  ],
  legend: [
    { color: palette.sky, label: "水中の点と浮力" },
    { color: palette.ink, label: "水上の点（浮力なし）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const state = waveUniforms(
      waveSet({ seed: 4, wavelength: 7, amplitude: 0.22, spread: 0.8 })
    );
    state.uWaveCount.value = 6;
    state.uSteepness.value = 0.5;
    const ocean = oceanSurface(state, { size: 70, segments: 300 });
    scene.add(ocean);

    const bodies = SPECS.map((spec) => {
      const [w, h, d] = spec.size;
      const mesh = new Mesh(
        new BoxGeometry(w, h, d),
        standard(spec.color, {
          roughness: 0.75,
          metalness: spec.density > 2000 ? 0.6 : 0,
        })
      );
      mesh.castShadow = true;
      scene.add(mesh);
      const volume = w * h * d;
      const mass = volume * spec.density;
      return {
        spec,
        mesh,
        volume,
        mass,
        // 直方体の慣性モーメント（本体座標）
        inertia: new Vector3(
          (mass * (h * h + d * d)) / 12,
          (mass * (w * w + d * d)) / 12,
          (mass * (w * w + h * h)) / 12
        ),
        position: new Vector3(),
        velocity: new Vector3(),
        orientation: new Quaternion(),
        angular: new Vector3(),
      };
    });
    const drop = () => {
      for (const [index, body] of bodies.entries()) {
        body.position.fromArray(body.spec.start);
        body.velocity.set(0, 0, 0);
        body.orientation.setFromAxisAngle(
          new Vector3(1, 0.3, 0.6).normalize(),
          0.5 + index * 0.4
        );
        body.angular.set(0, 0, 0);
      }
    };
    drop();

    const dots = new InstancedMesh(
      new SphereGeometry(0.06, 10, 8),
      standard("#ffffff", { emissive: 0.4 }),
      MAX_SAMPLES
    );
    dots.frustumCulled = false;
    scene.add(dots);
    const arrows = segments([], palette.sky, { width: 2 });
    scene.add(arrows);
    const arrowPoints: Vector3[] = [];
    const matrix = new Matrix4();
    const wet = new Color(palette.sky);
    const dry = new Color(palette.ink);

    const local = new Vector3();
    const world = new Vector3();
    const arm = new Vector3();
    const pointVelocity = new Vector3();
    const force = new Vector3();
    const torque = new Vector3();
    const totalForce = new Vector3();
    const inverse = new Quaternion();
    const spin = new Quaternion();

    return {
      action(key) {
        if (key === "drop") {
          drop();
        }
      },
      update({ time, dt }) {
        state.uTime.value = time;
        state.uAmplitudeScale.value = Number(params["height"]);
        const n = Number(params["samples"]);
        const drag = Number(params["drag"]);
        const show = params["forces"] === true;
        arrowPoints.length = 0;
        let dotIndex = 0;
        const steps = 4;
        const h = dt / steps;

        for (const body of bodies) {
          let submerged = 0;
          for (let step = 0; step < steps; step++) {
            totalForce.set(0, -body.mass * GRAVITY, 0);
            torque.set(0, 0, 0);
            submerged = 0;
            const [w, hh, d] = body.spec.size;
            const cellHeight = hh / n;
            const last = step === steps - 1;
            for (let k = 0; k < n; k++) {
              for (let j = 0; j < n; j++) {
                for (let i = 0; i < n; i++) {
                  // 物体を n×n×n の小さな箱に分け、その中心で水面との上下を調べる
                  local.set(
                    ((i + 0.5) / n - 0.5) * w,
                    ((j + 0.5) / n - 0.5) * hh,
                    ((k + 0.5) / n - 0.5) * d
                  );
                  arm.copy(local).applyQuaternion(body.orientation);
                  world.copy(arm).add(body.position);
                  const depth = waterHeight(state, world.x, world.z) - world.y;
                  const fraction = Math.min(
                    1,
                    Math.max(0, depth / cellHeight + 0.5)
                  );
                  if (fraction > 0) {
                    // アルキメデスの原理：押しのけた水の重さだけ上向きの力
                    const cellVolume = body.volume / n ** 3;
                    force.set(
                      0,
                      WATER_DENSITY * GRAVITY * cellVolume * fraction,
                      0
                    );
                    // 水中の点は、その点の速度に逆らう抵抗を受ける
                    pointVelocity
                      .copy(body.angular)
                      .cross(arm)
                      .add(body.velocity);
                    force.addScaledVector(
                      pointVelocity,
                      -drag * WATER_DENSITY * cellVolume * fraction * 2
                    );
                    totalForce.add(force);
                    torque.add(arm.clone().cross(force));
                    submerged += fraction / n ** 3;
                  }
                  if (last && show) {
                    matrix.makeTranslation(world.x, world.y, world.z);
                    dots.setMatrixAt(dotIndex, matrix);
                    dots.setColorAt(dotIndex, fraction > 0 ? wet : dry);
                    dotIndex++;
                    if (fraction > 0) {
                      arrowPoints.push(
                        world.clone(),
                        world
                          .clone()
                          .add(new Vector3(0, fraction * 0.5 * (4 / n), 0))
                      );
                    }
                  }
                }
              }
            }
            // 並進と回転を半陰的オイラー法で進める
            body.velocity.addScaledVector(totalForce, h / body.mass);
            body.position.addScaledVector(body.velocity, h);
            // 沈んだ物体は海底で止める
            if (body.position.y < -4) {
              body.position.y = -4;
              body.velocity.set(0, 0, 0);
            }
            inverse.copy(body.orientation).invert();
            torque.applyQuaternion(inverse);
            torque.divide(body.inertia);
            torque.applyQuaternion(body.orientation);
            body.angular.addScaledVector(torque, h);
            body.angular.multiplyScalar(1 - 0.2 * h);
            spin
              .set(
                body.angular.x * h * 0.5,
                body.angular.y * h * 0.5,
                body.angular.z * h * 0.5,
                0
              )
              .multiply(body.orientation);
            body.orientation.set(
              body.orientation.x + spin.x,
              body.orientation.y + spin.y,
              body.orientation.z + spin.z,
              body.orientation.w + spin.w
            );
            body.orientation.normalize();
          }
          body.mesh.position.copy(body.position);
          body.mesh.quaternion.copy(body.orientation);
          context.readout(
            body.spec.name,
            `${Math.round(submerged * 100)}% 沈む`
          );
        }

        dots.count = dotIndex;
        dots.visible = show;
        dots.instanceMatrix.needsUpdate = true;
        if (dots.instanceColor) {
          dots.instanceColor.needsUpdate = true;
        }
        arrows.visible = show;
        if (show) {
          arrows.setPoints(arrowPoints);
        }
        context.caption(
          n === 1
            ? "中心の 1 点だけで浮力を測ると、上下には浮き沈みするが、力が重心にしかかからないので傾きが生まれない。波の斜面に合わせて傾くことも、転覆から起き上がることもない。"
            : "水中にある点（青）ごとに、押しのけた水の重さだけ上向きの力を加える。沈んだ側ほど力が強いので、傾いた物体は起き上がり、波の斜面に沿って揺れる。水より重い鉄の箱は沈んでいく。"
        );
      },
    };
  },
};
