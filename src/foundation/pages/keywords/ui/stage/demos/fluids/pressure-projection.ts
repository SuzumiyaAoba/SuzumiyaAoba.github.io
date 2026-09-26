import {
  BoxGeometry,
  CylinderGeometry,
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  Vector3,
} from "three";
import { palette, pointCloud, rng, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const W = 72;
const H = 40;
const WORLD_W = 8;
const WORLD_H = (WORLD_W * H) / W;
const CENTER_Y = 1.8;
const OBSTACLE = { x: 26, y: 20, r: 6 };
const TRACERS = 900;
const INFLOW = 18;

export const demo: DemoModule = {
  alt: "水路の左から水が流れ込み、中央の柱にぶつかる様子で、圧力投影の役割を見るデモ。圧力投影をしないと、流れは柱に突っ込んで行き場を失い、水が湧き出したり消えたりする場所（発散）が赤と青で現れる。圧力投影をすると、各マスの圧力を解いて、流れ込んだ分だけ流れ出るよう速度を直すので、水は柱をよけて回り込む。",
  camera: { position: [0, 1.8, 6.4], target: [0, 1.8, 0], orbit: false },
  studio: { floor: false, background: "#0a0d12" },
  controls: [
    { type: "toggle", key: "project", label: "圧力投影", value: true },
    {
      type: "range",
      key: "iterations",
      label: "圧力を解く反復回数",
      min: 1,
      max: 150,
      step: 1,
      value: 80,
      hint: "少ないと発散が残り、流れが柱に少しめり込みます。",
    },
    {
      type: "select",
      key: "view",
      label: "背景の色",
      value: "divergence",
      options: [
        { value: "divergence", label: "発散（湧き出し・吸い込み）" },
        { value: "pressure", label: "圧力" },
      ],
    },
    { type: "toggle", key: "arrows", label: "速度の矢印", value: true },
  ],
  legend: [
    { color: palette.coral, label: "湧き出し / 高い圧力" },
    { color: palette.sky, label: "吸い込み / 低い圧力" },
    { color: palette.ink, label: "流れに乗る粒" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(2);
    let u = new Float32Array(W * H);
    let v = new Float32Array(W * H);
    let nu = new Float32Array(W * H);
    let nv = new Float32Array(W * H);
    const pressure = new Float32Array(W * H);
    const nextPressure = new Float32Array(W * H);
    const divergence = new Float32Array(W * H);
    const solid = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        if (Math.hypot(i - OBSTACLE.x, j - OBSTACLE.y) < OBSTACLE.r) {
          solid[j * W + i] = 1;
        }
      }
    }

    const data = new Uint8Array(W * H * 4);
    const texture = context.track(new DataTexture(data, W, H, RGBAFormat));
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = LinearFilter;
    const board = new Mesh(
      new PlaneGeometry(WORLD_W, WORLD_H),
      new MeshBasicMaterial({ map: texture })
    );
    board.position.set(0, CENTER_Y, 0);
    scene.add(board);
    const frame = new Mesh(
      new BoxGeometry(WORLD_W + 0.12, WORLD_H + 0.12, 0.06),
      standard("#2a2f3a", { metalness: 0.5 })
    );
    frame.position.set(0, CENTER_Y, -0.05);
    scene.add(frame);
    const toWorld = (x: number, y: number, z = 0.02) =>
      new Vector3(
        (x / W - 0.5) * WORLD_W,
        CENTER_Y + (y / H - 0.5) * WORLD_H,
        z
      );
    const pillar = new Mesh(
      new CylinderGeometry(
        (OBSTACLE.r / W) * WORLD_W,
        (OBSTACLE.r / W) * WORLD_W,
        0.3,
        48
      ),
      standard("#6b7385", { roughness: 0.5 })
    );
    pillar.rotation.x = Math.PI / 2;
    pillar.position.copy(toWorld(OBSTACLE.x, OBSTACLE.y, 0.15));
    scene.add(pillar);
    const arrows = segments([], "#dfe7f2", { width: 1.2, opacity: 0.7 });
    scene.add(arrows);
    const tracers = pointCloud(TRACERS, { size: 5, color: palette.ink });
    scene.add(tracers);
    const tx = new Float32Array(TRACERS);
    const ty = new Float32Array(TRACERS);
    const spawn = (k: number) => {
      tx[k] = random() * 3;
      ty[k] = 6 + random() * (H - 12);
    };
    for (let k = 0; k < TRACERS; k++) {
      spawn(k);
      tx[k] = random() * W;
    }

    const at = (field: Float32Array, x: number, y: number) => {
      const fx = Math.min(W - 1.001, Math.max(0, x));
      const fy = Math.min(H - 1.001, Math.max(0, y));
      const i = Math.floor(fx);
      const j = Math.floor(fy);
      const s = fx - i;
      const t = fy - j;
      const f = (a: number, b: number) => field[b * W + a] ?? 0;
      return (
        (f(i, j) * (1 - s) + f(i + 1, j) * s) * (1 - t) +
        (f(i, j + 1) * (1 - s) + f(i + 1, j + 1) * s) * t
      );
    };
    const isSolid = (i: number, j: number) =>
      i < 0 || i >= W || j < 0 || j >= H || solid[j * W + i] === 1;

    const boundaries = () => {
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          const k = j * W + i;
          if (solid[k] === 1) {
            u[k] = 0;
            v[k] = 0;
          }
          // 左端から一定の速さで流れ込む（上下の端は壁）
          if (i < 2) {
            u[k] = INFLOW;
            v[k] = 0;
          }
          if (j === 0 || j === H - 1) {
            v[k] = 0;
          }
        }
      }
    };

    const computeDivergence = () => {
      let total = 0;
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          const k = j * W + i;
          if (solid[k] === 1) {
            divergence[k] = 0;
            continue;
          }
          // 壁の向こうの速度は 0（壁を通り抜ける流れはない）
          const ur = isSolid(i + 1, j)
            ? i + 1 >= W
              ? (u[k] ?? 0)
              : 0
            : (u[k + 1] ?? 0);
          const ul = isSolid(i - 1, j) ? 0 : (u[k - 1] ?? 0);
          const vt = isSolid(i, j + 1) ? 0 : (v[k + W] ?? 0);
          const vb = isSolid(i, j - 1) ? 0 : (v[k - W] ?? 0);
          divergence[k] = 0.5 * (ur - ul + vt - vb);
          if (i > 2 && i < W - 2) {
            total += Math.abs(divergence[k] ?? 0);
          }
        }
      }
      return total / (W * H);
    };

    const project = (iterations: number) => {
      computeDivergence();
      // ∇²p = ∇·u を解く（ヤコビ法）。壁では圧力の傾きを 0、右の出口では圧力 0
      for (let it = 0; it < iterations; it++) {
        for (let j = 0; j < H; j++) {
          for (let i = 0; i < W; i++) {
            const k = j * W + i;
            if (solid[k] === 1) {
              nextPressure[k] = 0;
              continue;
            }
            const p = pressure[k] ?? 0;
            const pr =
              i + 1 >= W ? 0 : isSolid(i + 1, j) ? p : (pressure[k + 1] ?? 0);
            const pl = isSolid(i - 1, j) ? p : (pressure[k - 1] ?? 0);
            const pt = isSolid(i, j + 1) ? p : (pressure[k + W] ?? 0);
            const pb = isSolid(i, j - 1) ? p : (pressure[k - W] ?? 0);
            nextPressure[k] = (pr + pl + pt + pb - (divergence[k] ?? 0)) * 0.25;
          }
        }
        pressure.set(nextPressure);
      }
      // 圧力の傾きを速度から引く：圧力の高い所から低い所へ押し出される
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          const k = j * W + i;
          if (solid[k] === 1) {
            continue;
          }
          const p = pressure[k] ?? 0;
          const pr =
            i + 1 >= W ? 0 : isSolid(i + 1, j) ? p : (pressure[k + 1] ?? 0);
          const pl = isSolid(i - 1, j) ? p : (pressure[k - 1] ?? 0);
          const pt = isSolid(i, j + 1) ? p : (pressure[k + W] ?? 0);
          const pb = isSolid(i, j - 1) ? p : (pressure[k - W] ?? 0);
          u[k] = (u[k] ?? 0) - 0.5 * (pr - pl);
          v[k] = (v[k] ?? 0) - 0.5 * (pt - pb);
        }
      }
    };

    const step = (dt: number, useProjection: boolean, iterations: number) => {
      // 1. 速度の移流（半ラグランジュ）
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          const k = j * W + i;
          const x = i - (u[k] ?? 0) * dt;
          const y = j - (v[k] ?? 0) * dt;
          nu[k] = at(u, x, y) * 0.999;
          nv[k] = at(v, x, y) * 0.999;
        }
      }
      [u, nu] = [nu, u];
      [v, nv] = [nv, v];
      boundaries();
      // 2. 圧力投影
      if (useProjection) {
        project(iterations);
        boundaries();
      } else {
        pressure.fill(0);
      }
    };

    return {
      update({ dt }) {
        const useProjection = params["project"] === true;
        const iterations = Number(params["iterations"]);
        const h = Math.min(dt, 1 / 30) * 0.5;
        if (dt > 0) {
          for (let s = 0; s < 2; s++) {
            step(h, useProjection, iterations);
          }
          for (let k = 0; k < TRACERS; k++) {
            const x = tx[k] ?? 0;
            const y = ty[k] ?? 0;
            const mx = x + at(u, x, y) * h;
            const my = y + at(v, x, y) * h;
            tx[k] = x + at(u, mx, my) * h * 2;
            ty[k] = y + at(v, mx, my) * h * 2;
            if (
              (tx[k] ?? 0) > W - 1 ||
              (tx[k] ?? 0) < 0 ||
              (ty[k] ?? 0) < 0 ||
              (ty[k] ?? 0) > H - 1 ||
              isSolid(Math.round(tx[k] ?? 0), Math.round(ty[k] ?? 0))
            ) {
              spawn(k);
            }
          }
        }
        const residual = computeDivergence();
        const showPressure = params["view"] === "pressure";
        for (let k = 0; k < W * H; k++) {
          // 流入口のすぐそばは境界の都合で値が大きくなるので表示しない
          const inlet = k % W < 3;
          const value = inlet
            ? 0
            : showPressure
              ? (pressure[k] ?? 0) * 0.25
              : (divergence[k] ?? 0) * 0.35;
          const strength = Math.min(1, Math.abs(value));
          const base = [16, 20, 28];
          const hot = [245, 115, 111];
          const cold = [90, 169, 255];
          const target = value > 0 ? hot : cold;
          for (let c = 0; c < 3; c++) {
            data[k * 4 + c] =
              (base[c] ?? 0) + ((target[c] ?? 0) - (base[c] ?? 0)) * strength;
          }
          data[k * 4 + 3] = 255;
        }
        texture.needsUpdate = true;
        for (let k = 0; k < TRACERS; k++) {
          const p = toWorld(tx[k] ?? 0, ty[k] ?? 0, 0.04);
          tracers.positions[k * 3] = p.x;
          tracers.positions[k * 3 + 1] = p.y;
          tracers.positions[k * 3 + 2] = p.z;
        }
        tracers.commit();
        const showArrows = params["arrows"] === true;
        arrows.visible = showArrows;
        if (showArrows) {
          const points: Vector3[] = [];
          for (let j = 2; j < H; j += 3) {
            for (let i = 2; i < W; i += 3) {
              const k = j * W + i;
              if (solid[k] === 1) {
                continue;
              }
              const scale = 0.11;
              points.push(
                toWorld(i, j, 0.03),
                toWorld(i + (u[k] ?? 0) * scale, j + (v[k] ?? 0) * scale, 0.03)
              );
            }
          }
          arrows.setPoints(points);
        }
        context.readout("発散の平均", residual.toFixed(3));
        context.caption(
          useProjection
            ? "各マスで「流れ込む量 − 流れ出る量」（発散）を求め、それを打ち消す圧力をポアソン方程式で解き、圧力の高い所から低い所へ押し出すように速度を直す。水は柱の手前で圧力が高まり、柱をよけて回り込む。"
            : "圧力投影をしないと、流れは柱をよけることを知らずにまっすぐ突っ込み、粒は柱の中へ消えていく。柱の縁や後ろには、水が湧き出したり（赤）吸い込まれたり（青）する、ありえない場所が現れる。"
        );
      },
    };
  },
};
