import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { marker, palette, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const START = -6;
const END = 6;
const WALL_X = 2;
const WALL_HALF = 0.06;
const RADIUS = 0.1;
const LANES = [
  { key: "discrete", name: "離散：毎ステップの位置だけ調べる", z: -1.7 },
  { key: "substep", name: "サブステップ：細かく刻んで調べる", z: 0 },
  { key: "sweep", name: "連続：通り道を掃引して最初の接触を求める", z: 1.7 },
] as const;
const MAX_GHOSTS = 400;

type Lane = {
  x: number;
  ghosts: number;
  done: boolean;
  hit: boolean;
  checks: number;
  shots: number;
  tunnels: number;
  sweeps: Vector3[];
};

export const demo: DemoModule = {
  alt: "速い弾が薄い壁をすり抜ける問題と、それを防ぐ連続衝突判定のデモ。3 本の通路で、同じ速さの弾を同じ時間刻みで撃ち、スローモーションで比べる。毎ステップの位置だけを調べる離散的な判定では、1 ステップに進む距離が壁の厚さより大きいと、壁の手前と向こう側にしか弾がいない瞬間になり、すり抜けてしまう。ステップを細かく刻むと防げるが、判定の回数が増える。連続衝突判定では、前の位置から次の位置までの通り道を太さのある線分として掃引し、壁に最初に触れる時刻を求めるので、どんなに速くても当たる。",
  camera: {
    position: [0, 9.5, 5.5],
    target: [0, 0, 0.1],
    fov: 42,
    orbit: true,
  },
  controls: [
    {
      type: "range",
      key: "speed",
      label: "弾の速さ（m/s）",
      min: 5,
      max: 300,
      step: 5,
      value: 120,
    },
    {
      type: "range",
      key: "rate",
      label: "物理の更新（回 / 秒）",
      min: 15,
      max: 240,
      step: 15,
      value: 60,
      format: (value) => `${value} Hz`,
    },
    {
      type: "range",
      key: "slow",
      label: "1 発を見せる時間（秒）",
      min: 1,
      max: 6,
      step: 0.5,
      value: 2.5,
    },
  ],
  legend: [
    { color: palette.sky, label: "各ステップでの弾の位置" },
    { color: palette.amber, label: "掃引した通り道" },
    { color: palette.coral, label: "壁に当たった点" },
    { color: palette.lime, label: "すり抜けた弾" },
  ],
  setup(context) {
    const { scene, params } = context;
    const matrix = new Matrix4();
    const lanes = LANES.map((spec) => {
      const floor = new Mesh(
        new BoxGeometry(END - START + 1, 0.04, 1),
        standard("#1f2a3a", { roughness: 0.95 })
      );
      floor.position.set(0, -0.02, spec.z);
      floor.receiveShadow = true;
      const wall = new Mesh(
        new BoxGeometry(WALL_HALF * 2, 0.6, 1),
        standard("#8a97ab")
      );
      wall.position.set(WALL_X, 0.3, spec.z);
      wall.castShadow = true;
      const ghosts = new InstancedMesh(
        new SphereGeometry(RADIUS, 12, 8),
        new MeshBasicMaterial({
          color: palette.sky,
          transparent: true,
          opacity: 0.55,
        }),
        MAX_GHOSTS
      );
      ghosts.count = 0;
      ghosts.frustumCulled = false;
      const bullet = marker(palette.ink, RADIUS);
      const spark = marker(palette.coral, 0.16);
      spark.visible = false;
      const sweep = segments([], palette.amber, { width: 4, opacity: 0.55 });
      const label = context.label(spec.name, { tone: "muted" });
      label.position.set(START + 3, 0.02, spec.z - 0.62);
      scene.add(floor, wall, ghosts, bullet, spark, sweep, label);
      const state: Lane = {
        x: START,
        ghosts: 0,
        done: false,
        hit: false,
        checks: 0,
        shots: 0,
        tunnels: 0,
        sweeps: [],
      };
      return { ...spec, ghosts, bullet, spark, sweep, state };
    });

    let simTime = 0;
    let accumulator = 0;
    let hold = 0;
    const tunnelColor = new Color(palette.lime);
    const normalColor = new Color(palette.ink);

    // 発射のたびに、出発点をステップの長さの何分の一かずつずらす（壁との位置関係が毎回変わる）
    let phase = 0;
    const reset = () => {
      simTime = 0;
      accumulator = 0;
      phase = (phase + 0.618) % 1;
      const offset = phase * (Number(params["speed"]) / Number(params["rate"]));
      for (const lane of lanes) {
        lane.state.x = START - offset;
        lane.state.ghosts = 0;
        lane.state.done = false;
        lane.state.hit = false;
        lane.state.checks = 0;
        lane.state.shots++;
        lane.state.sweeps = [];
        lane.ghosts.count = 0;
        lane.spark.visible = false;
      }
    };
    reset();
    const overlapsWall = (x: number) =>
      x + RADIUS > WALL_X - WALL_HALF && x - RADIUS < WALL_X + WALL_HALF;

    const physicsStep = (dtSim: number, speed: number) => {
      for (const lane of lanes) {
        const { state } = lane;
        if (state.done) {
          continue;
        }
        const from = state.x;
        const to = from + speed * dtSim;
        if (lane.key === "discrete") {
          state.checks++;
          state.x = to;
          if (overlapsWall(to)) {
            state.hit = true;
            state.done = true;
          }
        } else if (lane.key === "substep") {
          // 1 回に進む距離が弾の半径を超えないように刻む
          const count = Math.max(1, Math.ceil((to - from) / RADIUS));
          for (let k = 1; k <= count; k++) {
            const x = from + ((to - from) * k) / count;
            state.checks++;
            state.x = x;
            if (overlapsWall(x)) {
              state.hit = true;
              state.done = true;
              break;
            }
          }
        } else {
          // 掃引：線分と、壁を弾の半径だけ太らせた箱との交差（最初に触れる時刻）
          state.checks++;
          const face = WALL_X - WALL_HALF - RADIUS;
          state.sweeps.push(
            new Vector3(from, 0.12, lane.z),
            new Vector3(
              Math.min(to, from < face && to >= face ? face : to),
              0.12,
              lane.z
            )
          );
          if (from <= face && to >= face) {
            state.x = face;
            state.hit = true;
            state.done = true;
          } else {
            state.x = to;
          }
        }
        if (state.ghosts < MAX_GHOSTS) {
          matrix.makeTranslation(state.x, RADIUS, lane.z);
          lane.ghosts.setMatrixAt(state.ghosts++, matrix);
        }
        if (state.x > END) {
          state.done = true;
          if (!state.hit) {
            state.tunnels++;
          }
        }
      }
    };

    return {
      update({ dt }) {
        const speed = Number(params["speed"]);
        const rate = Number(params["rate"]);
        const stepSim = 1 / rate;
        // 12 m を「1 発を見せる時間」で見せるスローモーション
        const scale = (END - START) / speed / Number(params["slow"]);
        const allDone = lanes.every((lane) => lane.state.done);
        if (allDone) {
          hold += dt;
          if (hold > 1) {
            hold = 0;
            reset();
          }
        } else {
          accumulator += dt * scale;
          while (accumulator >= stepSim) {
            accumulator -= stepSim;
            simTime += stepSim;
            physicsStep(stepSim, speed);
          }
        }
        for (const lane of lanes) {
          const { state } = lane;
          lane.ghosts.count = state.ghosts;
          lane.ghosts.instanceMatrix.needsUpdate = true;
          // 描画の位置は、物理の位置の間を補間して滑らかに見せる
          const shown = state.done ? state.x : state.x + speed * accumulator;
          lane.bullet.position.set(Math.min(END + 0.5, shown), RADIUS, lane.z);
          lane.bullet.visible = !(state.done && state.x > END);
          const tunneled = state.done && !state.hit;
          lane.bullet.material.color.copy(tunneled ? tunnelColor : normalColor);
          lane.spark.visible = state.hit;
          lane.spark.position.set(WALL_X - WALL_HALF, 0.2, lane.z);
          lane.sweep.setPoints(state.sweeps);
          lane.sweep.visible = state.sweeps.length > 0;
        }
        const perStep = (speed / rate).toFixed(2);
        context.readout(
          "1 ステップに進む距離",
          `${perStep} m（壁の厚さ ${(WALL_HALF * 2).toFixed(2)} m）`
        );
        for (const lane of lanes) {
          context.readout(
            lane.name.split("：")[0] ?? lane.name,
            `判定 ${lane.state.checks} 回・すり抜け ${lane.state.tunnels} / ${lane.state.shots} 発`
          );
        }
        context.caption(
          speed / rate > WALL_HALF * 2 + RADIUS * 2
            ? "1 ステップに進む距離が、壁の厚さと弾の太さの合計より大きい。離散的な判定では、壁の手前の位置と向こう側の位置しか調べないので、すり抜ける（緑）。サブステップは判定の回数を増やして防ぎ、連続衝突判定は通り道（黄色）と壁の交差から、最初に触れる時刻を 1 回で求める。"
            : "1 ステップに進む距離が短いうちは、離散的な判定でも壁に重なる瞬間があり、当たる。弾を速くするか、物理の更新を減らしてみると、すり抜けが起き始める。"
        );
      },
    };
  },
};
