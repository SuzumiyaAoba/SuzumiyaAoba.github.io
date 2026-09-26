import { CylinderGeometry, Mesh, Vector3 } from "three";
import { palette, standard } from "../../kit";
import { FluidTank, tankView } from "../../particleFluid";
import type { DemoModule } from "../../types";

const WIDTH = 3.2;
const HEIGHT = 2.2;
const SPACING = 0.05;
const RADIUS = 0.12;
const GRAVITY = 9.81;
const ORIGIN = new Vector3(-WIDTH / 2, 0, 0);
const PADDLE = 0.2;

export const demo: DemoModule = {
  alt: "水槽の中の水を、たくさんの粒子で表す SPH（平滑化粒子流体力学）のデモ。各粒子は、周りの粒子がどれだけ近くに集まっているかを重み付きで数えて自分の密度を求め、密度が高すぎれば周りを押しのける。ダムが崩れるように水が流れ出し、壁で跳ね返り、やがて平らな水面になる。水槽の中をドラッグすると、棒で水をかき混ぜられる。",
  camera: { position: [0, 1.3, 4.6], target: [0, 1, 0] },
  controls: [
    { type: "button", key: "dam", label: "ダムを崩す" },
    {
      type: "range",
      key: "stiffness",
      label: "圧力の強さ",
      min: 4,
      max: 80,
      step: 1,
      value: 30,
      hint: "弱いと水が縮みやすく、ぶよぶよした動きになります。",
    },
    {
      type: "toggle",
      key: "near",
      label: "近距離の反発（粒の固まり防止）",
      value: true,
    },
    {
      type: "range",
      key: "viscosity",
      label: "粘り気",
      min: 0,
      max: 3,
      step: 0.05,
      value: 0.2,
    },
    {
      type: "select",
      key: "color",
      label: "粒子の色",
      value: "speed",
      options: [
        { value: "speed", label: "速さ" },
        { value: "density", label: "密度（混み具合）" },
      ],
    },
  ],
  legend: [
    { color: "#1d5fd6", label: "遅い / 疎ら" },
    { color: "#bfeaff", label: "速い / 密集" },
    { color: palette.coral, label: "ドラッグで動かす棒" },
  ],
  hint: "水槽の中をドラッグすると、棒で水をかき混ぜられます。",
  setup(context) {
    const { scene, params, pointer } = context;
    const tank = new FluidTank({
      width: WIDTH,
      height: HEIGHT,
      radius: RADIUS,
      capacity: 900,
    });
    const view = tankView(context, tank, {
      origin: ORIGIN,
      particleRadius: 0.034,
    });
    const density = new Float64Array(tank.capacity);
    const nearDensity = new Float64Array(tank.capacity);
    const paddle = new Mesh(
      new CylinderGeometry(PADDLE, PADDLE, 0.5, 32),
      standard(palette.coral, { roughness: 0.4 })
    );
    paddle.rotation.x = Math.PI / 2;
    paddle.visible = false;
    scene.add(paddle);
    const dam = () => tank.fillBlock(0.05, 0.05, 1.1, 1.5, SPACING);
    dam();
    // 静止した水の中での密度（基準の密度）
    tank.findNeighbors();
    let restDensity = 0;
    {
      const i = Math.floor(tank.count / 2) + 5;
      for (
        let t = tank.neighborStart[i] ?? 0;
        t < (tank.neighborStart[i + 1] ?? 0);
        t++
      ) {
        const j = tank.neighbors[t] ?? 0;
        const q =
          1 -
          Math.hypot(
            (tank.x[j] ?? 0) - (tank.x[i] ?? 0),
            (tank.y[j] ?? 0) - (tank.y[i] ?? 0)
          ) /
            RADIUS;
        restDensity += q * q;
      }
    }
    const hit = new Vector3();
    let obstacle: { x: number; y: number; r: number } | null = null;

    const step = (
      h: number,
      stiffness: number,
      nearStiffness: number,
      viscosity: number
    ) => {
      const { x, y, vx, vy, px, py } = tank;
      // 1. 重力で速度を更新し、位置を予測する
      for (let i = 0; i < tank.count; i++) {
        vy[i] = (vy[i] ?? 0) - GRAVITY * h;
      }
      tank.findNeighbors();
      // 2. 粘り気：近づき合う 2 粒子の速度差を少し打ち消す
      if (viscosity > 0) {
        for (let i = 0; i < tank.count; i++) {
          for (
            let t = tank.neighborStart[i] ?? 0;
            t < (tank.neighborStart[i + 1] ?? 0);
            t++
          ) {
            const j = tank.neighbors[t] ?? 0;
            if (j < i) {
              continue;
            }
            const dx = (x[j] ?? 0) - (x[i] ?? 0);
            const dy = (y[j] ?? 0) - (y[i] ?? 0);
            const r = Math.hypot(dx, dy);
            const q = r / RADIUS;
            const nx = dx / r;
            const ny = dy / r;
            const u =
              ((vx[i] ?? 0) - (vx[j] ?? 0)) * nx +
              ((vy[i] ?? 0) - (vy[j] ?? 0)) * ny;
            if (u > 0) {
              const impulse = h * (1 - q) * viscosity * u * 0.5;
              vx[i] = (vx[i] ?? 0) - impulse * nx;
              vy[i] = (vy[i] ?? 0) - impulse * ny;
              vx[j] = (vx[j] ?? 0) + impulse * nx;
              vy[j] = (vy[j] ?? 0) + impulse * ny;
            }
          }
        }
      }
      for (let i = 0; i < tank.count; i++) {
        px[i] = x[i] ?? 0;
        py[i] = y[i] ?? 0;
        x[i] = (x[i] ?? 0) + (vx[i] ?? 0) * h;
        y[i] = (y[i] ?? 0) + (vy[i] ?? 0) * h;
      }
      // 3. 密度：近くの粒子ほど重く数える（カーネル関数 (1 − r/h)²）
      for (let i = 0; i < tank.count; i++) {
        let rho = 0;
        let rhoNear = 0;
        for (
          let t = tank.neighborStart[i] ?? 0;
          t < (tank.neighborStart[i + 1] ?? 0);
          t++
        ) {
          const j = tank.neighbors[t] ?? 0;
          const r = Math.hypot(
            (x[j] ?? 0) - (x[i] ?? 0),
            (y[j] ?? 0) - (y[i] ?? 0)
          );
          const q = Math.max(0, 1 - r / RADIUS);
          rho += q * q;
          rhoNear += q * q * q;
        }
        density[i] = rho;
        nearDensity[i] = rhoNear;
        // 4. 圧力：基準の密度より混んでいれば、周りを押しのける
        const pressure = stiffness * (rho - restDensity);
        const nearPressure = nearStiffness * rhoNear;
        let dxSelf = 0;
        let dySelf = 0;
        for (
          let t = tank.neighborStart[i] ?? 0;
          t < (tank.neighborStart[i + 1] ?? 0);
          t++
        ) {
          const j = tank.neighbors[t] ?? 0;
          const dx = (x[j] ?? 0) - (x[i] ?? 0);
          const dy = (y[j] ?? 0) - (y[i] ?? 0);
          const r = Math.hypot(dx, dy);
          if (r < 1e-9 || r >= RADIUS) {
            continue;
          }
          const q = 1 - r / RADIUS;
          const push = h * h * (pressure * q + nearPressure * q * q) * 0.5;
          x[j] = (x[j] ?? 0) + (dx / r) * push;
          y[j] = (y[j] ?? 0) + (dy / r) * push;
          dxSelf -= (dx / r) * push;
          dySelf -= (dy / r) * push;
        }
        x[i] = (x[i] ?? 0) + dxSelf;
        y[i] = (y[i] ?? 0) + dySelf;
      }
      tank.collide(obstacle);
      // 5. 位置の変化から速度を求め直す
      for (let i = 0; i < tank.count; i++) {
        vx[i] = ((x[i] ?? 0) - (px[i] ?? 0)) / h;
        vy[i] = ((y[i] ?? 0) - (py[i] ?? 0)) / h;
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
        const stiffness = Number(params["stiffness"]);
        const nearStiffness = params["near"] === true ? stiffness * 2 : 0;
        const viscosity = Number(params["viscosity"]);
        if (dt > 0) {
          const substeps = 2;
          for (let s = 0; s < substeps; s++) {
            step(
              Math.min(dt, 1 / 30) / substeps,
              stiffness,
              nearStiffness,
              viscosity
            );
          }
        }
        const byDensity = params["color"] === "density";
        view.update((i) =>
          byDensity
            ? ((density[i] ?? 0) / restDensity - 0.6) * 1.6
            : Math.hypot(tank.vx[i] ?? 0, tank.vy[i] ?? 0) / 3
        );
        let average = 0;
        for (let i = 0; i < tank.count; i++) {
          average += (density[i] ?? 0) / tank.count;
        }
        context.readout("粒子", `${tank.count}`);
        context.readout(
          "平均の密度 / 基準",
          `${((average / restDensity) * 100).toFixed(0)}%`
        );
        context.caption(
          "SPH では、流体を小さな粒子の集まりとし、各粒子の密度を「近くにいる粒子を、距離に応じた重み（カーネル関数）で数えた量」で求める。密度が基準より高ければ圧力で周りを押しのけ、低ければ寄ってくる。格子がいらず、飛び散る水しぶきも自然に扱える。"
        );
      },
    };
  },
};
