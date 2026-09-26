import {
  BoxGeometry,
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  Vector3,
} from "three";
import { palette, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const N = 112;
const PANEL = 2.6;
const GAP = 0.25;
const PERIOD = 8;
const TRACE_STEPS = 8;

const toWorld = (center: number, a: number, b: number) =>
  new Vector3(
    center + (a / N - 0.5) * PANEL,
    1.6 + (b / N - 0.5) * PANEL,
    0.02
  );

type Field = Float32Array<ArrayBuffer>; // RGB × N × N

/** 最初の絵：色付きの市松模様と円。 */
function initialImage(): Field {
  const field = new Float32Array(N * N * 3);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = i / N;
      const y = j / N;
      const checker = (Math.floor(x * 8) + Math.floor(y * 8)) % 2;
      let r = checker ? 0.9 : 0.12;
      let g = checker ? 0.85 : 0.14;
      let b = checker ? 0.75 : 0.2;
      const d = Math.hypot(x - 0.5, y - 0.68);
      if (d < 0.16) {
        r = 1;
        g = 0.45;
        b = 0.2;
      }
      if (Math.abs(x - 0.5) < 0.03 && y > 0.2 && y < 0.5) {
        r = 0.25;
        g = 0.75;
        b = 1;
      }
      field.set([r, g, b], (j * N + i) * 3);
    }
  }
  return field;
}

/** 流れの速度（マス/秒）。「ねじって戻す」は時間とともに向きが反転し、周期の終わりに元の絵に戻るはずの流れ。 */
function velocity(flow: string, x: number, y: number, t: number) {
  const cx = x / N - 0.5;
  const cy = y / N - 0.5;
  if (flow === "rotate") {
    return { u: -cy * N * 0.8, v: cx * N * 0.8 };
  }
  const r = Math.hypot(cx, cy);
  const speed =
    Math.max(0, 1 - r / 0.5) * N * 1.6 * Math.cos((Math.PI * t) / PERIOD);
  return { u: -cy * speed, v: cx * speed };
}

function sample(field: Field, x: number, y: number, channel: number) {
  const fx = Math.min(N - 1.001, Math.max(0, x));
  const fy = Math.min(N - 1.001, Math.max(0, y));
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const s = fx - i;
  const t = fy - j;
  const at = (a: number, b: number) => field[(b * N + a) * 3 + channel] ?? 0;
  return (
    (at(i, j) * (1 - s) + at(i + 1, j) * s) * (1 - t) +
    (at(i, j + 1) * (1 - s) + at(i + 1, j + 1) * s) * t
  );
}

/** 半ラグランジュ移流：各マスの中心から速度を逆向きにたどり、たどり着いた場所の値を補間して持ってくる。 */
function semiLagrangian(
  source: Field,
  target: Field,
  flow: string,
  t: number,
  dt: number
) {
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const { u, v } = velocity(flow, i, j, t);
      const x = i - u * dt;
      const y = j - v * dt;
      for (let c = 0; c < 3; c++) {
        target[(j * N + i) * 3 + c] = sample(source, x, y, c);
      }
    }
  }
}

/** MacCormack 法：前に進めてから逆に戻し、戻らなかった分（誤差）の半分を補正する。 */
function macCormack(
  source: Field,
  target: Field,
  scratch: Field,
  scratch2: Field,
  flow: string,
  t: number,
  dt: number
) {
  semiLagrangian(source, scratch, flow, t, dt);
  semiLagrangian(scratch, scratch2, flow, t, -dt);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const { u, v } = velocity(flow, i, j, t);
      const x = Math.min(N - 1.001, Math.max(0, i - u * dt));
      const y = Math.min(N - 1.001, Math.max(0, j - v * dt));
      const i0 = Math.floor(x);
      const j0 = Math.floor(y);
      for (let c = 0; c < 3; c++) {
        const index = (j * N + i) * 3 + c;
        let value =
          (scratch[index] ?? 0) +
          ((source[index] ?? 0) - (scratch2[index] ?? 0)) * 0.5;
        // 補正で元になかった明るさが生まれないよう、たどった先の 4 マスの範囲に収める
        const corners = [
          source[(j0 * N + i0) * 3 + c] ?? 0,
          source[(j0 * N + i0 + 1) * 3 + c] ?? 0,
          source[((j0 + 1) * N + i0) * 3 + c] ?? 0,
          source[((j0 + 1) * N + i0 + 1) * 3 + c] ?? 0,
        ];
        value = Math.min(
          Math.max(value, Math.min(...corners)),
          Math.max(...corners)
        );
        target[index] = value;
      }
    }
  }
}

/** 素朴な方法：その場の勾配と速度から、前向きに差分で進める（不安定）。 */
function forwardEuler(
  source: Field,
  target: Field,
  flow: string,
  t: number,
  dt: number
) {
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const { u, v } = velocity(flow, i, j, t);
      for (let c = 0; c < 3; c++) {
        const at = (a: number, b: number) =>
          source[
            (Math.min(N - 1, Math.max(0, b)) * N +
              Math.min(N - 1, Math.max(0, a))) *
              3 +
              c
          ] ?? 0;
        const dx = (at(i + 1, j) - at(i - 1, j)) / 2;
        const dy = (at(i, j + 1) - at(i, j - 1)) / 2;
        target[(j * N + i) * 3 + c] = at(i, j) - dt * (u * dx + v * dy);
      }
    }
  }
}

export const demo: DemoModule = {
  alt: "流れに乗せて絵を運ぶ（移流する）方法を 3 つ並べて比べるデモ。左の素朴な方法は、その場所の傾きから前向きに計算するので、すぐに縞模様が暴れて絵が壊れる。中央の半ラグランジュ移流は、各マスから流れを逆向きにたどり、たどり着いた場所の色を持ってくるので決して暴れないが、補間のたびに少しずつぼやける。右の MacCormack 法は、その誤差を見積もって補正するので、ずっとくっきり保たれる。",
  camera: { position: [0, 1.6, 6.2], target: [0, 1.6, 0], orbit: false },
  studio: { floor: false, background: "#0a0d12" },
  controls: [
    {
      type: "select",
      key: "flow",
      label: "流れ",
      value: "twist",
      options: [
        { value: "twist", label: "ねじって戻す（周期ごとに元の絵へ）" },
        { value: "rotate", label: "回転" },
      ],
    },
    {
      type: "range",
      key: "cfl",
      label: "1 ステップで流れる距離",
      min: 0.25,
      max: 4,
      step: 0.05,
      value: 1.5,
      format: (value) => `${value} マス`,
      hint: "半ラグランジュ移流は、1 マス以上流れる大きな刻みでも安定します。",
    },
    { type: "toggle", key: "trace", label: "逆向きにたどる様子", value: true },
    { type: "button", key: "reset", label: "最初の絵に戻す" },
  ],
  legend: [
    {
      color: palette.amber,
      label: "マスの中心から流れを逆向きにたどった線（8 ステップ分）",
    },
  ],
  setup(context) {
    const { scene, params } = context;
    const labels = ["素朴な前進差分", "半ラグランジュ移流", "MacCormack 法"];
    const panels = labels.map((name, index) => {
      const data = new Uint8Array(N * N * 4);
      const texture = context.track(new DataTexture(data, N, N, RGBAFormat));
      texture.colorSpace = SRGBColorSpace;
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearFilter;
      const x = (index - 1) * (PANEL + GAP);
      const mesh = new Mesh(
        new PlaneGeometry(PANEL, PANEL),
        new MeshBasicMaterial({ map: texture })
      );
      mesh.position.set(x, 1.6, 0);
      const frame = new Mesh(
        new BoxGeometry(PANEL + 0.1, PANEL + 0.1, 0.06),
        standard("#2a2f3a", { metalness: 0.5 })
      );
      frame.position.set(x, 1.6, -0.05);
      const label = context.label(name, { tone: "strong" });
      label.position.set(x, 1.6 + PANEL / 2 + 0.22, 0);
      scene.add(mesh, frame, label);
      return {
        data,
        texture,
        field: initialImage(),
        next: new Float32Array(N * N * 3),
        x,
      };
    });
    const scratch = new Float32Array(N * N * 3);
    const scratch2 = new Float32Array(N * N * 3);
    const traces = segments([], palette.amber, { width: 1.6 });
    scene.add(traces);

    let time = 0;
    let accumulator = 0;
    let currentFlow = "";
    const reset = () => {
      time = 0;
      accumulator = 0;
      for (const panel of panels) {
        panel.field = initialImage();
      }
    };

    return {
      action(key) {
        if (key === "reset") {
          reset();
        }
      },
      update({ dt }) {
        const flow = String(params["flow"]);
        if (flow !== currentFlow) {
          currentFlow = flow;
          reset();
        }
        // 1 ステップで流れる最大の距離（マス）から時間刻みを決める
        const maxSpeed = flow === "rotate" ? N * 0.8 * 0.5 : N * 1.6 * 0.25;
        const stepDt = Number(params["cfl"]) / maxSpeed;
        accumulator += dt * 0.6;
        let steps = 0;
        while (accumulator >= stepDt && steps < 4) {
          accumulator -= stepDt;
          steps++;
          const [naive, semi, mac] = panels;
          if (naive && semi && mac) {
            forwardEuler(naive.field, naive.next, flow, time, stepDt);
            semiLagrangian(semi.field, semi.next, flow, time, stepDt);
            macCormack(
              mac.field,
              mac.next,
              scratch,
              scratch2,
              flow,
              time,
              stepDt
            );
            for (const panel of panels) {
              [panel.field, panel.next] = [panel.next, panel.field];
            }
          }
          time += stepDt;
          if (flow === "twist" && time >= PERIOD) {
            time -= PERIOD;
          }
        }
        for (const panel of panels) {
          for (let k = 0; k < N * N; k++) {
            for (let c = 0; c < 3; c++) {
              const value = panel.field[k * 3 + c] ?? 0;
              panel.data[k * 4 + c] = Number.isFinite(value)
                ? Math.max(0, Math.min(255, value * 255))
                : 255;
            }
            panel.data[k * 4 + 3] = 255;
          }
          panel.texture.needsUpdate = true;
        }
        // 中央のパネルに、逆向きにたどる線を描く
        const showTrace = params["trace"] === true;
        traces.visible = showTrace;
        if (showTrace) {
          const center = panels[1]?.x ?? 0;
          const points: Vector3[] = [];
          for (let j = 8; j < N; j += 16) {
            for (let i = 8; i < N; i += 16) {
              // 8 ステップ分、逆向きにたどった道筋
              let x = i;
              let y = j;
              for (let k = 0; k < TRACE_STEPS; k++) {
                const { u, v } = velocity(flow, x, y, time);
                const nx = x - u * stepDt;
                const ny = y - v * stepDt;
                points.push(toWorld(center, x, y), toWorld(center, nx, ny));
                x = nx;
                y = ny;
              }
            }
          }
          traces.setPoints(points);
        }
        context.readout("格子", `${N}×${N}`);
        if (flow === "twist") {
          context.readout(
            "周期のうち",
            `${Math.round((time / PERIOD) * 100)}%`
          );
        }
        context.caption(
          "半ラグランジュ移流は、各マスの中心から流れを 1 ステップ分逆向きにたどり（黄の線）、たどり着いた場所の色を周りの 4 マスから補間して持ってくる。持ってくるのは必ず周りにある色の平均なので、どんなに大きな刻みでも値が暴れない。代わりに、補間を重ねるほどぼやけていく。"
        );
      },
    };
  },
};
