import { CylinderGeometry, Mesh, Vector3 } from "three";
import { palette, standard } from "../../kit";
import { FluidTank, tankView } from "../../particleFluid";
import type { DemoModule } from "../../types";

const WIDTH = 3.2;
const HEIGHT = 2.2;
const SPACING = 0.05;
const H = 0.1;
const GRAVITY = 9.81;
const ORIGIN = new Vector3(-WIDTH / 2, 0, 0);
const PADDLE = 0.2;
const POLY6 = 4 / (Math.PI * H ** 8);
const SPIKY = -30 / (Math.PI * H ** 5);
const RELAXATION = 10;

const poly6 = (r2: number) => (r2 < H * H ? POLY6 * (H * H - r2) ** 3 : 0);

export const demo: DemoModule = {
  alt: "PBF（位置ベース流体）で水を動かすデモ。各粒子について「周りの密度が基準と同じであること」を拘束とし、位置ベース物理と同じように、拘束を満たすよう粒子の位置を直接直すことをくり返す。反復を増やすほど水は縮まなくなり、ダムが崩れても体積がほぼ保たれる。反復を減らすと、水がわずかに押しつぶされる。",
  camera: { position: [0, 1.3, 4.6], target: [0, 1, 0] },
  controls: [
    { type: "button", key: "dam", label: "ダムを崩す" },
    {
      type: "range",
      key: "iterations",
      label: "密度拘束の反復回数",
      min: 2,
      max: 8,
      step: 1,
      value: 4,
    },
    {
      type: "toggle",
      key: "tension",
      label: "人工圧力（粒の固まり防止・表面張力）",
      value: true,
    },
    {
      type: "range",
      key: "xsph",
      label: "XSPH 粘性",
      min: 0,
      max: 0.3,
      step: 0.01,
      value: 0.05,
    },
    {
      type: "select",
      key: "color",
      label: "粒子の色",
      value: "density",
      options: [
        { value: "density", label: "密度（混み具合）" },
        { value: "speed", label: "速さ" },
      ],
    },
  ],
  legend: [
    { color: "#1d5fd6", label: "疎ら / 遅い" },
    { color: "#bfeaff", label: "密集 / 速い" },
    { color: palette.coral, label: "ドラッグで動かす棒" },
  ],
  hint: "水槽の中をドラッグすると、棒で水をかき混ぜられます。",
  setup(context) {
    const { scene, params, pointer } = context;
    const tank = new FluidTank({
      width: WIDTH,
      height: HEIGHT,
      radius: H,
      capacity: 900,
    });
    const view = tankView(context, tank, {
      origin: ORIGIN,
      particleRadius: 0.032,
    });
    const lambda = new Float64Array(tank.capacity);
    const density = new Float64Array(tank.capacity);
    const dx = new Float64Array(tank.capacity);
    const dy = new Float64Array(tank.capacity);
    const paddle = new Mesh(
      new CylinderGeometry(PADDLE, PADDLE, 0.5, 32),
      standard(palette.coral, { roughness: 0.4 })
    );
    paddle.rotation.x = Math.PI / 2;
    paddle.visible = false;
    scene.add(paddle);
    const dam = () => tank.fillBlock(0.05, 0.05, 1.1, 1.5, SPACING);
    dam();
    // 基準の密度：静止した粒子の並びで測った値
    tank.findNeighbors();
    let restDensity = POLY6 * H ** 6;
    {
      const i = Math.floor(tank.count / 2) + 5;
      for (
        let t = tank.neighborStart[i] ?? 0;
        t < (tank.neighborStart[i + 1] ?? 0);
        t++
      ) {
        const j = tank.neighbors[t] ?? 0;
        restDensity += poly6(
          ((tank.x[j] ?? 0) - (tank.x[i] ?? 0)) ** 2 +
            ((tank.y[j] ?? 0) - (tank.y[i] ?? 0)) ** 2
        );
      }
    }
    const correctionBase = poly6((0.2 * H) ** 2);
    const hit = new Vector3();
    let obstacle: { x: number; y: number; r: number } | null = null;

    const step = (
      h: number,
      iterations: number,
      tension: boolean,
      viscosity: number
    ) => {
      const { x, y, vx, vy, px, py } = tank;
      // 1. 予測：重力で速度を変え、仮の位置へ動かす
      for (let i = 0; i < tank.count; i++) {
        vy[i] = (vy[i] ?? 0) - GRAVITY * h;
        px[i] = x[i] ?? 0;
        py[i] = y[i] ?? 0;
        x[i] = (x[i] ?? 0) + (vx[i] ?? 0) * h;
        y[i] = (y[i] ?? 0) + (vy[i] ?? 0) * h;
      }
      tank.findNeighbors();
      // 2. 密度の拘束 C = ρ/ρ₀ − 1 = 0 を、位置の補正で満たす
      for (let iteration = 0; iteration < iterations; iteration++) {
        for (let i = 0; i < tank.count; i++) {
          let rho = POLY6 * H ** 6;
          let gradSum = 0;
          let gx = 0;
          let gy = 0;
          for (
            let t = tank.neighborStart[i] ?? 0;
            t < (tank.neighborStart[i + 1] ?? 0);
            t++
          ) {
            const j = tank.neighbors[t] ?? 0;
            const rx = (x[i] ?? 0) - (x[j] ?? 0);
            const ry = (y[i] ?? 0) - (y[j] ?? 0);
            const r2 = rx * rx + ry * ry;
            rho += poly6(r2);
            const r = Math.sqrt(r2);
            if (r > 1e-9 && r < H) {
              const g = (SPIKY * (H - r) ** 2) / r / restDensity;
              gradSum += g * g * r2;
              gx += g * rx;
              gy += g * ry;
            }
          }
          density[i] = rho;
          // 水面では周りが少なく密度が下がるが、引き寄せると粒が固まるので、混みすぎのときだけ直す
          const constraint = Math.max(0, rho / restDensity - 1);
          gradSum += gx * gx + gy * gy;
          lambda[i] = -constraint / (gradSum + RELAXATION);
        }
        for (let i = 0; i < tank.count; i++) {
          let sx = 0;
          let sy = 0;
          for (
            let t = tank.neighborStart[i] ?? 0;
            t < (tank.neighborStart[i + 1] ?? 0);
            t++
          ) {
            const j = tank.neighbors[t] ?? 0;
            const rx = (x[i] ?? 0) - (x[j] ?? 0);
            const ry = (y[i] ?? 0) - (y[j] ?? 0);
            const r2 = rx * rx + ry * ry;
            const r = Math.sqrt(r2);
            if (r < 1e-9 || r >= H) {
              continue;
            }
            // 人工圧力：近づきすぎた粒子同士を少し押し離し、粒が固まるのを防ぐ
            const correction = tension
              ? -2e-5 * (poly6(r2) / correctionBase) ** 4
              : 0;
            const g = (SPIKY * (H - r) ** 2) / r;
            const scale =
              ((lambda[i] ?? 0) + (lambda[j] ?? 0) + correction) * g;
            sx += scale * rx;
            sy += scale * ry;
          }
          dx[i] = sx / restDensity;
          dy[i] = sy / restDensity;
        }
        for (let i = 0; i < tank.count; i++) {
          x[i] = (x[i] ?? 0) + (dx[i] ?? 0);
          y[i] = (y[i] ?? 0) + (dy[i] ?? 0);
        }
        tank.collide(obstacle);
      }
      // 3. 速度を求め直し、XSPH 粘性で近くの粒子と速度をならす
      for (let i = 0; i < tank.count; i++) {
        vx[i] = ((x[i] ?? 0) - (px[i] ?? 0)) / h;
        vy[i] = ((y[i] ?? 0) - (py[i] ?? 0)) / h;
      }
      if (viscosity > 0) {
        for (let i = 0; i < tank.count; i++) {
          let ax = 0;
          let ay = 0;
          for (
            let t = tank.neighborStart[i] ?? 0;
            t < (tank.neighborStart[i + 1] ?? 0);
            t++
          ) {
            const j = tank.neighbors[t] ?? 0;
            const w =
              poly6(
                ((x[i] ?? 0) - (x[j] ?? 0)) ** 2 +
                  ((y[i] ?? 0) - (y[j] ?? 0)) ** 2
              ) / restDensity;
            ax += ((vx[j] ?? 0) - (vx[i] ?? 0)) * w;
            ay += ((vy[j] ?? 0) - (vy[i] ?? 0)) * w;
          }
          dx[i] = ax;
          dy[i] = ay;
        }
        for (let i = 0; i < tank.count; i++) {
          vx[i] = (vx[i] ?? 0) + viscosity * (dx[i] ?? 0);
          vy[i] = (vy[i] ?? 0) + viscosity * (dy[i] ?? 0);
        }
      }
    };

    return {
      action(key) {
        if (key === "dam") {
          dam();
        }
      },
      update({ dt }) {
        const found = pointer.down
          ? context.pointerOnPlane(
              { normal: [0, 0, 1], origin: [0, 0, 0] },
              hit
            )
          : null;
        obstacle = found
          ? { x: found.x - ORIGIN.x, y: found.y - ORIGIN.y, r: PADDLE }
          : null;
        paddle.visible = obstacle !== null;
        if (found) {
          paddle.position.set(found.x, found.y, 0);
        }
        if (dt > 0) {
          const substeps = 2;
          for (let s = 0; s < substeps; s++) {
            step(
              Math.min(dt, 1 / 30) / substeps,
              Number(params["iterations"]),
              params["tension"] === true,
              Number(params["xsph"])
            );
          }
        }
        const byDensity = params["color"] === "density";
        view.update((i) =>
          byDensity
            ? ((density[i] ?? 0) / restDensity - 0.7) * 2
            : Math.hypot(tank.vx[i] ?? 0, tank.vy[i] ?? 0) / 3
        );
        let surface = 0;
        for (let i = 0; i < tank.count; i++) {
          surface = Math.max(surface, tank.y[i] ?? 0);
        }
        let inner = 0;
        let innerCount = 0;
        for (let i = 0; i < tank.count; i++) {
          if (
            (tank.neighborStart[i + 1] ?? 0) - (tank.neighborStart[i] ?? 0) >=
            9
          ) {
            inner += density[i] ?? 0;
            innerCount++;
          }
        }
        context.readout("粒子", `${tank.count}`);
        context.readout(
          "内部の密度 / 基準",
          `${((inner / Math.max(1, innerCount) / restDensity) * 100).toFixed(0)}%`
        );
        context.caption(
          "各粒子に「周りの密度が基準と等しい」という拘束を課し、その拘束をどれだけ破っているかと、位置を動かしたときの密度の変わり方から補正量（λ）を求めて、粒子の位置を直接直す。力を積分する SPH と違い、大きな時間刻みでも発散しにくく、反復回数で縮まなさを調整できる。"
        );
      },
    };
  },
};
