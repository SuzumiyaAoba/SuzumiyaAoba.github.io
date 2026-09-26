import {
  BoxGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { palette, rng, standard, trail } from "../../kit";
import { hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const WALL_Z = -1.5;
const SUBSTEPS = 8;
const RATIOS = [0.35, 1, 2.5] as const;
const COLORS = [palette.coral, palette.cyan, palette.violet] as const;
const NAMES = [
  "ζ = 0.35（不足減衰）",
  "ζ = 1（臨界減衰）",
  "ζ = 2.5（過減衰）",
] as const;

/** 初期ずれ 1・初速 0 から目標へ向かうときの「進み具合」（0 → 1）。 */
function stepResponse(zeta: number, omega: number, t: number) {
  let x: number;
  if (zeta < 0.999) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    x =
      Math.exp(-zeta * omega * t) *
      (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
  } else if (zeta < 1.001) {
    x = (1 + omega * t) * Math.exp(-omega * t);
  } else {
    const root = Math.sqrt(zeta * zeta - 1);
    const r1 = -omega * (zeta - root);
    const r2 = -omega * (zeta + root);
    x = (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
  }
  return 1 - x;
}

function settleTime(zeta: number, omega: number) {
  let last = 0;
  for (let t = 0; t < 10; t += 0.005) {
    if (Math.abs(1 - stepResponse(zeta, omega, t)) > 0.02) {
      last = t;
    }
  }
  return last;
}

function reticle(color: string) {
  const group = new Group();
  const material = standard(color, { emissive: 1.1 });
  group.add(new Mesh(new TorusGeometry(0.34, 0.025, 10, 48), material));
  for (const [x, y] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const bar = new Mesh(
      new BoxGeometry(x === 0 ? 0.03 : 0.22, y === 0 ? 0.03 : 0.22, 0.03),
      material
    );
    bar.position.set(x * 0.4, y * 0.4, 0);
    group.add(bar);
  }
  return group;
}

export const demo: DemoModule = {
  alt: "壁の上を跳び移る標的を、減衰比の異なる 3 つの照準が追いかけるデモ。不足減衰の照準は行き過ぎて揺れ、過減衰はゆっくり遅れ、臨界減衰は揺れずに最も速く標的に収まる。",
  camera: { position: [0, 2.4, 7.4], target: [0, 2, WALL_Z] },
  bloom: { strength: 0.6, radius: 0.4, threshold: 0.85 },
  controls: [
    {
      type: "range",
      key: "omega",
      label: "固有角振動数 ω（反応の速さ）",
      min: 3,
      max: 20,
      step: 0.5,
      value: 9,
      format: (value) => `${value.toFixed(1)} rad/s`,
    },
    {
      type: "range",
      key: "interval",
      label: "標的が移る間隔",
      min: 0.6,
      max: 3,
      step: 0.1,
      value: 1.6,
      format: (value) => `${value.toFixed(1)} 秒`,
    },
  ],
  legend: COLORS.map((color, index) => ({ color, label: NAMES[index] ?? "" })),
  setup(context) {
    const { scene, params } = context;
    const random = rng(21);
    const wall = new Mesh(
      new PlaneGeometry(9, 4.6),
      standard("#1a2230", { roughness: 0.9 })
    );
    wall.position.set(0, 2.3, WALL_Z - 0.02);
    wall.receiveShadow = true;
    scene.add(wall);
    const target = new Mesh(
      new SphereGeometry(0.16, 32, 24),
      standard(palette.amber, { emissive: 0.7 })
    );
    const goal = new Vector3(0, 2.3, WALL_Z + 0.1);
    target.position.copy(goal);
    scene.add(target);

    const aims = RATIOS.map((zeta, index) => {
      const mesh = reticle(COLORS[index] ?? palette.ink);
      const line = trail(50, COLORS[index] ?? palette.ink, { width: 2 });
      scene.add(mesh, line);
      return {
        zeta,
        mesh,
        line,
        position: goal.clone(),
        velocity: new Vector3(),
      };
    });

    const graph = hudGraph(context, {
      title: "標的が移ってからの進み具合",
      min: -0.1,
      max: 1.5,
      xMax: 1.5,
      xLabel: "秒",
    });
    let lastOmega = 0;
    let settleTimes: number[] = [];
    let sinceJump = 0;
    const force = new Vector3();

    return {
      update({ dt }) {
        const omega = Number(params["omega"]);
        if (omega !== lastOmega) {
          lastOmega = omega;
          settleTimes = RATIOS.map((zeta) => settleTime(zeta, omega));
          graph.setSeries(
            RATIOS.map((zeta, index) => ({
              fn: (t: number) => stepResponse(zeta, omega, t),
              color: COLORS[index] ?? palette.ink,
            }))
          );
        }
        sinceJump += dt;
        if (sinceJump > Number(params["interval"])) {
          sinceJump = 0;
          goal.set((random() - 0.5) * 7, 0.7 + random() * 3.2, WALL_Z + 0.1);
          target.position.copy(goal);
        }
        graph.setMarker(Math.min(1.5, sinceJump));
        const k = omega * omega;
        const h = dt / SUBSTEPS;
        for (const aim of aims) {
          const c = 2 * aim.zeta * omega;
          const steps = dt > 0 ? SUBSTEPS : 0;
          for (let step = 0; step < steps; step++) {
            force
              .copy(goal)
              .sub(aim.position)
              .multiplyScalar(k)
              .addScaledVector(aim.velocity, -c);
            aim.velocity.addScaledVector(force, h);
            aim.position.addScaledVector(aim.velocity, h);
          }
          aim.mesh.position.copy(aim.position).setZ(WALL_Z + 0.2);
          aim.line.push(aim.mesh.position);
        }
        for (const index of RATIOS.keys()) {
          context.readout(
            `${NAMES[index]?.split("（")[0] ?? ""} の整定時間`,
            `${(settleTimes[index] ?? 0).toFixed(2)} 秒`
          );
        }
        context.caption(
          "同じ硬さ（ω）でも、減衰が足りなければ揺れ、多すぎれば遅れる。ζ = 1 は『揺れない範囲で最も速い』境界。"
        );
      },
    };
  },
};
