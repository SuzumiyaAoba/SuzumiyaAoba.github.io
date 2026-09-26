import { Color, Vector3 } from "three";
import { palette } from "../../kit";
import { particleView } from "../../particleFluid";
import { PicFluid } from "../../pic2d";
import type { Transfer } from "../../pic2d";
import type { DemoModule } from "../../types";

const SIZE = 1.6;
const GAP = 0.25;
const SPACING = 0.05;
const RADIUS = 0.3 * SPACING;
const MAX = 5200;
const SPIN = 2.5;

const METHODS: readonly { mode: Transfer; label: string; flip: number }[] = [
  { mode: "pic", label: "PIC", flip: 0 },
  { mode: "flip", label: "FLIP", flip: 0.97 },
  { mode: "apic", label: "APIC", flip: 0 },
];

export const demo: DemoModule = {
  alt: "水槽いっぱいの水に渦を起こし、PIC・FLIP・APIC の 3 つの方法で同時に計算して比べるデモ。粘り気のない水の渦は、本来なかなか弱まらないはず。PIC は粒子と格子の間で速度を受け渡すたびに回転が失われ、すぐに止まってしまう。FLIP は回転を保つが粒子の並びが乱れる。APIC は、粒子ごとに「周りの速度の傾き」も一緒に運ぶので、回転をよく保ったまま、なめらかに回り続ける。",
  camera: { position: [0, 0.8, 4.8], target: [0, 0.8, 0], orbit: false },
  controls: [
    {
      type: "select",
      key: "scene",
      label: "題材",
      value: "spin",
      options: [
        { value: "spin", label: "水槽の中の渦（無重力）" },
        { value: "dam", label: "ダム崩壊" },
      ],
    },
    { type: "button", key: "reset", label: "最初から" },
    {
      type: "select",
      key: "color",
      label: "粒子の色",
      value: "stripe",
      options: [
        { value: "stripe", label: "最初の位置で縞模様" },
        { value: "speed", label: "速さ" },
      ],
    },
  ],
  legend: [
    { color: "#5aa9ff", label: "水の粒子（色は最初の並び）" },
    { color: palette.amber, label: "保たれた回転の割合" },
  ],
  setup(context) {
    const { params } = context;
    const tanks = METHODS.map((method, index) => {
      const fluid = new PicFluid(SIZE, SIZE, SPACING, RADIUS, MAX);
      const origin = new Vector3((index - 1) * (SIZE + GAP) - SIZE / 2, 0, 0);
      const view = particleView(context, {
        capacity: MAX,
        width: SIZE,
        height: SIZE,
        origin,
        particleRadius: RADIUS * 1.3,
      });
      const label = context.label(method.label, { tone: "strong" });
      label.position.set(origin.x + SIZE / 2, SIZE + 0.15, 0);
      context.scene.add(label);
      return {
        ...method,
        fluid,
        view,
        stripe: new Uint8Array(MAX),
        startMomentum: 1,
      };
    });

    let currentScene = "";
    const angularMomentum = (fluid: PicFluid) => {
      let sum = 0;
      for (let i = 0; i < fluid.count; i++) {
        const rx = (fluid.pos[2 * i] ?? 0) - SIZE / 2;
        const ry = (fluid.pos[2 * i + 1] ?? 0) - SIZE / 2;
        sum += rx * (fluid.vel[2 * i + 1] ?? 0) - ry * (fluid.vel[2 * i] ?? 0);
      }
      return sum;
    };
    const reset = (kind: string) => {
      currentScene = kind;
      for (const tank of tanks) {
        const { fluid } = tank;
        const dx = 2 * RADIUS;
        const dy = (Math.sqrt(3) / 2) * dx;
        let count = 0;
        for (let j = 0; j * dy < SIZE; j++) {
          for (let i = 0; i * dx < SIZE; i++) {
            const x = fluid.h + RADIUS + i * dx + (j % 2 === 0 ? 0 : RADIUS);
            const y = fluid.h + RADIUS + j * dy;
            const inside =
              kind === "spin"
                ? x < SIZE - fluid.h - RADIUS && y < SIZE - fluid.h - RADIUS
                : x < 0.6 && y < 1.1;
            if (!inside || count >= MAX) {
              continue;
            }
            fluid.pos[2 * count] = x;
            fluid.pos[2 * count + 1] = y;
            // 水槽いっぱいの水を、中心の周りに回しておく（中心から離れるほど弱める）
            const r = Math.hypot(x - SIZE / 2, y - SIZE / 2);
            const swirl =
              kind === "spin" ? SPIN * Math.max(0, 1 - r / 0.75) : 0;
            fluid.vel[2 * count] = -(y - SIZE / 2) * swirl;
            fluid.vel[2 * count + 1] = (x - SIZE / 2) * swirl;
            // 最初の位置で縞模様の色を決めておく（混ざり方が見える）
            tank.stripe[count] =
              kind === "spin"
                ? Math.floor(
                    (Math.atan2(y - SIZE / 2, x - SIZE / 2) / Math.PI + 1) * 4
                  ) % 2
                : Math.floor(y / 0.15) % 2;
            count++;
          }
        }
        fluid.count = count;
        fluid.affine.fill(0);
        fluid.restDensity = 0;
        fluid.u.fill(0);
        fluid.v.fill(0);
        tank.startMomentum = angularMomentum(fluid);
      }
    };

    const light = new Color("#8fd0ff");
    const dark = new Color("#1d4fa8");
    return {
      action(key) {
        if (key === "reset") {
          reset(String(params["scene"]));
        }
      },
      update({ dt }) {
        const kind = String(params["scene"]);
        if (kind !== currentScene) {
          reset(kind);
        }
        const byStripe = params["color"] === "stripe";
        for (const tank of tanks) {
          if (dt > 0) {
            tank.fluid.step({
              dt: Math.min(dt, 1 / 30),
              gravity: kind === "spin" ? 0 : -9.81,
              mode: tank.mode,
              flipRatio: tank.flip,
              pressureIterations: 40,
              obstacle: null,
            });
          }
          tank.view.update(
            tank.fluid.count,
            (i) => [tank.fluid.pos[2 * i] ?? 0, tank.fluid.pos[2 * i + 1] ?? 0],
            (i) =>
              Math.hypot(
                tank.fluid.vel[2 * i] ?? 0,
                tank.fluid.vel[2 * i + 1] ?? 0
              ) / 2.5,
            byStripe
              ? (i, out) => out.copy((tank.stripe[i] ?? 0) === 1 ? light : dark)
              : undefined
          );
          if (kind === "spin") {
            const ratio = angularMomentum(tank.fluid) / tank.startMomentum;
            context.readout(
              `${tank.label} の回転`,
              `${Math.max(0, Math.round(ratio * 100))}%`
            );
          }
        }
        context.caption(
          kind === "spin"
            ? "PIC は、格子の速度を粒子へ戻すとき、粒子の周りの速度を平均してしまうので、回転（角運動量）がどんどん失われる。APIC は、粒子に「周りで速度がどう変わっているか」（速度の傾き）も持たせ、格子とやり取りするときに使うので、回転を失わない。"
            : "ダムが崩れる動きでも、PIC は粘ってのっぺりし、FLIP は細かく乱れ、APIC はその中間で、なめらかさと勢いを両立する。"
        );
      },
    };
  },
};
