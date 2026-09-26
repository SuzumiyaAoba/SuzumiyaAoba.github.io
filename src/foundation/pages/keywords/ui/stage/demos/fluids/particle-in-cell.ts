import {
  CylinderGeometry,
  DataTexture,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  RGBAFormat,
  Vector3,
} from "three";
import { palette, standard } from "../../kit";
import { particleView } from "../../particleFluid";
import { PicFluid } from "../../pic2d";
import type { PicObstacle } from "../../pic2d";
import type { DemoModule } from "../../types";

const WIDTH = 3.2;
const HEIGHT = 2.2;
const SPACING = 0.045;
const RADIUS = 0.3 * SPACING;
const ORIGIN = new Vector3(-WIDTH / 2, 0, 0);
const PADDLE = 0.2;
const MAX = 4000;

export const demo: DemoModule = {
  alt: "粒子と格子を組み合わせて水を計算する PIC・FLIP のデモ。水は粒子として運ばれるが、速度はいったん格子に集めて、格子の上で圧力を解き、流れが縮まないように直してから粒子へ戻す。格子の速度をそのまま粒子に写す PIC は、受け渡しのたびに速度がならされて水あめのように粘る。格子で起きた速度の変化分だけを粒子に足す FLIP は、細かい動きが残って水しぶきが上がる。",
  camera: { position: [0, 1.2, 4.4], target: [0, 1, 0] },
  controls: [
    { type: "button", key: "dam", label: "ダムを崩す" },
    {
      type: "range",
      key: "flip",
      label: "FLIP の割合",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.9,
      hint: "0 = PIC（なめらかだが粘る）、1 = FLIP（生き生きしているが粒がばらつく）。",
    },
    { type: "toggle", key: "grid", label: "水のあるセルを表示", value: false },
  ],
  legend: [
    { color: "#1d5fd6", label: "遅い" },
    { color: "#bfeaff", label: "速い" },
    { color: palette.coral, label: "ドラッグで動かす棒" },
  ],
  hint: "水槽の中をドラッグすると、棒で水をかき混ぜられます。",
  setup(context) {
    const { scene, params, pointer } = context;
    const fluid = new PicFluid(WIDTH, HEIGHT, SPACING, RADIUS, MAX);
    const view = particleView(context, {
      capacity: MAX,
      width: WIDTH,
      height: HEIGHT,
      origin: ORIGIN,
      particleRadius: RADIUS * 1.25,
    });
    const data = new Uint8Array(fluid.numX * fluid.numY * 4);
    const texture = context.track(
      new DataTexture(data, fluid.numX, fluid.numY, RGBAFormat)
    );
    texture.magFilter = NearestFilter;
    const cells = new Mesh(
      new PlaneGeometry(fluid.numX * fluid.h, fluid.numY * fluid.h),
      new MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
    );
    cells.position.set(
      ORIGIN.x + (fluid.numX * fluid.h) / 2,
      ORIGIN.y + (fluid.numY * fluid.h) / 2,
      -0.2
    );
    scene.add(cells);
    const paddle = new Mesh(
      new CylinderGeometry(PADDLE, PADDLE, 0.5, 32),
      standard(palette.coral, { roughness: 0.4 })
    );
    paddle.rotation.x = Math.PI / 2;
    paddle.visible = false;
    scene.add(paddle);

    const dam = () => {
      const dx = 2 * RADIUS;
      const dy = (Math.sqrt(3) / 2) * dx;
      let count = 0;
      for (let i = 0; i < Math.floor((1.1 - 2 * RADIUS) / dx); i++) {
        for (let j = 0; j < Math.floor((1.5 - 2 * RADIUS) / dy); j++) {
          if (count >= MAX) {
            break;
          }
          fluid.pos[2 * count] =
            fluid.h + RADIUS + dx * i + (j % 2 === 0 ? 0 : RADIUS);
          fluid.pos[2 * count + 1] = fluid.h + RADIUS + dy * j;
          fluid.vel[2 * count] = 0;
          fluid.vel[2 * count + 1] = 0;
          count++;
        }
      }
      fluid.count = count;
      fluid.affine.fill(0);
      fluid.restDensity = 0;
      fluid.u.fill(0);
      fluid.v.fill(0);
    };
    dam();

    const hit = new Vector3();
    let previous: { x: number; y: number } | null = null;
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
        let obstacle: PicObstacle = null;
        if (found && dt > 0) {
          const x = found.x - ORIGIN.x;
          const y = found.y - ORIGIN.y;
          obstacle = {
            x,
            y,
            r: PADDLE,
            vx: previous ? (x - previous.x) / dt : 0,
            vy: previous ? (y - previous.y) / dt : 0,
          };
          previous = { x, y };
          paddle.position.set(found.x, found.y, 0);
        } else {
          previous = null;
        }
        paddle.visible = obstacle !== null;
        const flip = Number(params["flip"]);
        if (dt > 0) {
          fluid.step({
            dt: Math.min(dt, 1 / 30),
            gravity: -9.81,
            mode: flip <= 0 ? "pic" : "flip",
            flipRatio: flip,
            pressureIterations: 50,
            obstacle,
          });
        }
        view.update(
          fluid.count,
          (i) => [fluid.pos[2 * i] ?? 0, fluid.pos[2 * i + 1] ?? 0],
          (i) =>
            Math.hypot(fluid.vel[2 * i] ?? 0, fluid.vel[2 * i + 1] ?? 0) / 3
        );
        const showGrid = params["grid"] === true;
        cells.visible = showGrid;
        if (showGrid) {
          for (let i = 0; i < fluid.numX; i++) {
            for (let j = 0; j < fluid.numY; j++) {
              const type = fluid.typeAt(i, j);
              const k = (j * fluid.numX + i) * 4;
              const rgb =
                type === 0
                  ? [40, 110, 200]
                  : type === 2
                    ? [90, 96, 110]
                    : [14, 18, 26];
              data[k] = rgb[0] ?? 0;
              data[k + 1] = rgb[1] ?? 0;
              data[k + 2] = rgb[2] ?? 0;
              data[k + 3] = ((i + j) % 2) * 40 + 200;
            }
          }
          texture.needsUpdate = true;
        }
        context.readout("粒子", `${fluid.count}`);
        context.readout("格子", `${fluid.numX}×${fluid.numY}`);
        context.caption(
          "毎ステップ、①粒子を動かし、②粒子の速度を近くの格子点へ重み付きで集め、③格子の上で圧力を解いて縮まない流れに直し、④格子の速度を粒子へ戻す。PIC は④で格子の速度そのものを写し、FLIP は③で変わった分だけを粒子の速度に足す。"
        );
      },
    };
  },
};
