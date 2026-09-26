import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  RingGeometry,
  Vector3,
} from "three";
import { clamp, palette, standard } from "../../kit";
import { hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const linear = (t: number) => clamp(t);
const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const smoother = (t: number) => {
  const x = clamp(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const functions = { linear, smooth, smoother } as const;
const names = {
  linear: "線形（clamp）",
  smooth: "smoothstep",
  smoother: "smootherstep",
} as const;
const colors = {
  linear: palette.coral,
  smooth: palette.cyan,
  smoother: palette.violet,
} as const;
type FunctionKey = keyof typeof functions;
const keys: readonly FunctionKey[] = ["linear", "smooth", "smoother"];

const GRID = 9;
const SPACING = 0.42;
const FIELD_X = 2.3;

export const demo: DemoModule = {
  alt: "左では線形、smoothstep、smootherstep の 3 つの補間で昇降機が上下し、端での止まり方の違いを比べられる。右では動く光の輪からの距離に smoothstep をかけて柱の高さを決め、境界が柔らかく盛り上がる。",
  camera: { position: [-0.6, 6.4, 10.4], target: [-0.4, 1.1, 0] },
  controls: [
    {
      type: "select",
      key: "field",
      label: "右の柱に使う関数",
      value: "smooth",
      options: [
        { value: "linear", label: "線形" },
        { value: "smooth", label: "smoothstep" },
        { value: "smoother", label: "smootherstep" },
      ],
    },
    {
      type: "range",
      key: "inner",
      label: "edge0（内側の境界）",
      min: 0,
      max: 1.5,
      step: 0.05,
      value: 0.4,
      format: (value) => `${value.toFixed(2)} m`,
    },
    {
      type: "range",
      key: "outer",
      label: "edge1（外側の境界）",
      min: 0.5,
      max: 3,
      step: 0.05,
      value: 1.6,
      format: (value) => `${value.toFixed(2)} m`,
    },
    {
      type: "range",
      key: "period",
      label: "昇降の周期",
      min: 1.5,
      max: 6,
      step: 0.1,
      value: 3,
      format: (value) => `${value.toFixed(1)} 秒`,
    },
  ],
  legend: [
    { color: palette.coral, label: "線形" },
    { color: palette.cyan, label: "smoothstep" },
    { color: palette.violet, label: "smootherstep" },
  ],
  setup(context) {
    const { scene, params } = context;
    const lifts = keys.map((key, index) => {
      const shaft = new Mesh(
        new BoxGeometry(0.9, 3.2, 0.08),
        standard("#1c2533", { roughness: 0.8 })
      );
      shaft.position.set(-4.2 + index * 1.25, 1.6, -0.5);
      shaft.receiveShadow = true;
      const car = new Mesh(
        new BoxGeometry(0.8, 0.14, 0.8),
        standard(colors[key], { roughness: 0.4, emissive: 0.25 })
      );
      car.castShadow = true;
      const label = context.label(names[key], {
        color: colors[key],
        tone: "muted",
      });
      label.position.set(shaft.position.x, 3.5, -0.5);
      scene.add(shaft, car, label);
      return { key, car, x: shaft.position.x };
    });

    const pillars = new InstancedMesh(
      new BoxGeometry(SPACING * 0.86, 1, SPACING * 0.86),
      standard("#ffffff", { roughness: 0.45 }),
      GRID * GRID
    );
    pillars.castShadow = true;
    pillars.receiveShadow = true;
    scene.add(pillars);
    const ring = new Mesh(
      new RingGeometry(0.96, 1, 64),
      standard(palette.amber, { emissive: 1 })
    );
    ring.rotation.x = -Math.PI / 2;
    const ringOuter = new Mesh(
      new RingGeometry(0.97, 1, 64),
      standard(palette.amber, { emissive: 0.5 })
    );
    ringOuter.rotation.x = -Math.PI / 2;
    scene.add(ring, ringOuter);

    const graph = hudGraph(context, { title: "3 つの補間関数", xLabel: "t" });
    graph.setSeries(
      keys.map((key) => ({
        fn: functions[key],
        color: colors[key],
        label: names[key],
      }))
    );
    const matrix = new Matrix4();
    const identity = new Quaternion();
    const scale = new Vector3();
    const position = new Vector3();
    const low = new Color("#243349");
    const high = new Color(palette.amber);
    const tint = new Color();
    const probe = new Vector3();

    return {
      update({ time }) {
        const period = Number(params["period"]);
        const phase = (time % period) / period;
        // 行き 40%・停止 10%・帰り 40%・停止 10%
        const t =
          phase < 0.4
            ? phase / 0.4
            : phase < 0.5
              ? 1
              : phase < 0.9
                ? 1 - (phase - 0.5) / 0.4
                : 0;
        for (const lift of lifts) {
          lift.car.position.set(
            lift.x,
            0.2 + functions[lift.key](t) * 2.6,
            -0.4
          );
        }
        graph.setMarker(t);

        const field = String(params["field"]);
        const fn =
          functions[
            field === "linear" || field === "smoother" ? field : "smooth"
          ];
        const inner = Number(params["inner"]);
        const outer = Math.max(inner + 0.05, Number(params["outer"]));
        probe.set(
          FIELD_X + Math.cos(time * 0.6) * 1.1,
          0,
          Math.sin(time * 0.9) * 1.1
        );
        ring.position.set(probe.x, 0.02, probe.z);
        ring.scale.setScalar(Math.max(0.01, inner));
        ringOuter.position.set(probe.x, 0.02, probe.z);
        ringOuter.scale.setScalar(outer);
        let index = 0;
        for (let gx = 0; gx < GRID; gx++) {
          for (let gz = 0; gz < GRID; gz++) {
            const x = FIELD_X + (gx - (GRID - 1) / 2) * SPACING;
            const z = (gz - (GRID - 1) / 2) * SPACING;
            const distance = Math.hypot(x - probe.x, z - probe.z);
            const value = 1 - fn((distance - inner) / (outer - inner));
            const height = 0.08 + value * 1.1;
            matrix.compose(
              position.set(x, height / 2, z),
              identity,
              scale.set(1, height, 1)
            );
            pillars.setMatrixAt(index, matrix);
            pillars.setColorAt(index, tint.copy(low).lerp(high, value));
            index++;
          }
        }
        pillars.instanceMatrix.needsUpdate = true;
        if (pillars.instanceColor) {
          pillars.instanceColor.needsUpdate = true;
        }

        context.readout("t", t.toFixed(2));
        context.readout("端での速さ（線形）", "1.0");
        context.readout("端での速さ（smooth 系）", "0.0");
        context.caption(
          "smoothstep は 3t² − 2t³。両端で傾きが 0 なので、動き出しと止まりが穏やかになる。edge0〜edge1 の範囲に値を写して、境界を柔らかくぼかす用途にも使う。"
        );
      },
    };
  },
};
