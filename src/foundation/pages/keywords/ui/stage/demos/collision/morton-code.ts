import {
  Color,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from "three";
import { diagramPanel, svg } from "../../arena";
import { palette, polyline, ramp, segments } from "../../kit";
import type { DemoModule } from "../../types";

const N = 16;
const BITS = 4;
const CELL = 0.36;

/** x と y のビットを交互に並べる（x が偶数桁、y が奇数桁）。 */
function morton(x: number, y: number) {
  let code = 0;
  for (let bit = 0; bit < BITS; bit++) {
    code += ((x >> bit) & 1) << (2 * bit);
    code += ((y >> bit) & 1) << (2 * bit + 1);
  }
  return code;
}

type Order = "morton" | "row";
const orderIndex = (order: Order, x: number, y: number) =>
  order === "morton" ? morton(x, y) : y * N + x;

const bin = (value: number, digits: number) =>
  value.toString(2).padStart(digits, "0");

const center = (x: number, y: number, h = 0.02) =>
  new Vector3((x - (N - 1) / 2) * CELL - 1.4, h, (y - (N - 1) / 2) * CELL);

export const demo: DemoModule = {
  alt: "2 次元の格子のセルを、近いもの同士が近い番号になるように一列に並べるモートン符号（Z 順序）のデモ。セルの x と y の座標を 2 進数で書き、そのビットを交互に並べた数がモートン符号で、その順にセルをたどると Z の字をくり返す曲線になる。行ごとに並べる場合と比べて、ある範囲（白い枠）のセルが、一列の中の少ない数のひと続きの区間にまとまる。カーソルを乗せたセルのビットの並びを右下に表示する。",
  camera: {
    position: [0, 9.5, 4.2],
    target: [0, 0, 0.3],
    fov: 42,
    orbit: false,
  },
  controls: [
    {
      type: "select",
      key: "order",
      label: "並べ方",
      value: "morton",
      options: [
        { value: "morton", label: "モートン符号（Z 順序）" },
        { value: "row", label: "行ごと（行優先）" },
      ],
    },
    {
      type: "range",
      key: "w",
      label: "範囲の幅",
      min: 1,
      max: 8,
      step: 1,
      value: 4,
    },
    {
      type: "range",
      key: "h",
      label: "範囲の高さ",
      min: 1,
      max: 8,
      step: 1,
      value: 3,
    },
    { type: "toggle", key: "curve", label: "たどる順の線を表示", value: true },
  ],
  legend: [
    { color: palette.violet, label: "番号が小さい" },
    { color: palette.amber, label: "番号が大きい" },
    { color: palette.ink, label: "範囲と、そのひと続きの区間" },
  ],
  hint: "セルにカーソルを乗せると、ビットの並びを表示します",
  setup(context) {
    const { scene, params } = context;
    const cells = new InstancedMesh(
      new PlaneGeometry(CELL * 0.92, CELL * 0.92).rotateX(-Math.PI / 2),
      new MeshBasicMaterial(),
      N * N
    );
    cells.frustumCulled = false;
    const matrix = new Matrix4();
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const c = center(x, y, 0);
        matrix.makeTranslation(c.x, c.y, c.z);
        cells.setMatrixAt(y * N + x, matrix);
      }
    }
    scene.add(cells);
    const curve = polyline([], palette.ink, { width: 2, opacity: 0.8 });
    const box = segments([], palette.ink, { width: 3 });
    const hover = segments([], palette.lime, { width: 3 });
    scene.add(curve, box, hover);
    // 一列に並べた帯（右側）：範囲に入るセルの位置を示す
    const strip = new InstancedMesh(
      new PlaneGeometry(0.34, 0.03).rotateX(-Math.PI / 2),
      new MeshBasicMaterial(),
      N * N
    );
    strip.frustumCulled = false;
    const STRIP_X = 2.6;
    for (let i = 0; i < N * N; i++) {
      const column = Math.floor(i / 128);
      matrix.makeTranslation(
        STRIP_X + column * 0.5,
        0.01,
        -2.85 + (i % 128) * 0.045
      );
      strip.setMatrixAt(i, matrix);
    }
    scene.add(strip);
    const stripLabel = context.label("一列に並べた番号（0 → 255）", {
      tone: "muted",
    });
    stripLabel.position.set(STRIP_X + 0.25, 0.02, -3.15);
    scene.add(stripLabel);

    const { root } = diagramPanel(context, {
      title: "ビットを交互に並べる",
      width: 300,
      height: 96,
      rem: 16,
    });
    const rows = [0, 1, 2].map((i) => {
      const text = svg("text", {
        x: 8,
        y: 24 + i * 28,
        fill: "#e8eef6",
        "font-size": 13,
      });
      root.append(text);
      return text;
    });

    let signature = "";
    let hoverCell: [number, number] = [5, 6];

    return {
      update({ time }) {
        const order: Order = params["order"] === "row" ? "row" : "morton";
        const w = Number(params["w"]);
        const h = Number(params["h"]);
        // 範囲はゆっくり動く
        const bx = Math.floor((Math.sin(time * 0.25) * 0.5 + 0.5) * (N - w));
        const by = Math.floor((Math.cos(time * 0.19) * 0.5 + 0.5) * (N - h));
        const key = `${order}|${w}|${h}|${bx}|${by}`;
        const pointer = context.pointerOnPlane();
        if (pointer) {
          const px = Math.round((pointer.x + 1.4) / CELL + (N - 1) / 2);
          const py = Math.round(pointer.z / CELL + (N - 1) / 2);
          if (px >= 0 && py >= 0 && px < N && py < N) {
            hoverCell = [px, py];
          }
        }
        const [hx, hy] = hoverCell;
        const c = center(hx, hy, 0.03);
        const half = (CELL / 2) * 0.95;
        hover.setPoints([
          c.clone().add(new Vector3(-half, 0, -half)),
          c.clone().add(new Vector3(half, 0, -half)),
          c.clone().add(new Vector3(half, 0, -half)),
          c.clone().add(new Vector3(half, 0, half)),
          c.clone().add(new Vector3(half, 0, half)),
          c.clone().add(new Vector3(-half, 0, half)),
          c.clone().add(new Vector3(-half, 0, half)),
          c.clone().add(new Vector3(-half, 0, -half)),
        ]);
        const code = orderIndex(order, hx, hy);
        rows[0]?.replaceChildren(
          document.createTextNode(`x = ${hx}（${bin(hx, BITS)}）`)
        );
        rows[1]?.replaceChildren(
          document.createTextNode(`y = ${hy}（${bin(hy, BITS)}）`)
        );
        if (order === "morton") {
          // y と x のビットを上の桁から交互に並べて表示
          const text = rows.at(2);
          if (text) {
            text.replaceChildren();
            text.append(document.createTextNode(`符号 = ${code}（`));
            for (let bit = BITS - 1; bit >= 0; bit--) {
              text.append(
                svg("tspan", { fill: palette.amber }, `${(hy >> bit) & 1}`),
                svg("tspan", { fill: palette.sky }, `${(hx >> bit) & 1}`)
              );
            }
            text.append(document.createTextNode("）"));
          }
        } else {
          rows[2]?.replaceChildren(
            document.createTextNode(`番号 = y × 16 + x = ${code}`)
          );
        }

        if (key === signature) {
          return;
        }
        signature = key;
        const inBox = (x: number, y: number) =>
          x >= bx && x < bx + w && y >= by && y < by + h;
        const selected = Array.from({ length: N * N }, () => false);
        const path: Vector3[] = Array.from(
          { length: N * N },
          () => new Vector3()
        );
        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            const index = orderIndex(order, x, y);
            path[index] = center(x, y, 0.02);
            selected[index] = inBox(x, y);
            const color = ramp(index / (N * N - 1), [
              palette.violet,
              palette.sky,
              palette.lime,
              palette.amber,
            ]);
            cells.setColorAt(
              y * N + x,
              inBox(x, y) ? color : color.clone().multiplyScalar(0.35)
            );
          }
        }
        if (cells.instanceColor) {
          cells.instanceColor.needsUpdate = true;
        }
        let runs = 0;
        let lastSelected = -1;
        for (let i = 0; i < N * N; i++) {
          if (selected[i] === true && (i === 0 || selected[i - 1] !== true)) {
            runs++;
          }
          if (selected[i] === true) {
            lastSelected = i;
          }
          strip.setColorAt(
            i,
            selected[i] === true ? new Color(palette.ink) : new Color("#1f2a3a")
          );
        }
        if (strip.instanceColor) {
          strip.instanceColor.needsUpdate = true;
        }
        const firstSelected = selected.indexOf(true);
        curve.setPoints(path);
        curve.visible = params["curve"] === true;
        const b0 = center(bx, by, 0.04).add(
          new Vector3(-CELL / 2, 0, -CELL / 2)
        );
        const b1 = center(bx + w - 1, by + h - 1, 0.04).add(
          new Vector3(CELL / 2, 0, CELL / 2)
        );
        box.setPoints([
          b0,
          new Vector3(b1.x, 0.04, b0.z),
          new Vector3(b1.x, 0.04, b0.z),
          b1,
          b1,
          new Vector3(b0.x, 0.04, b1.z),
          new Vector3(b0.x, 0.04, b1.z),
          b0,
        ]);
        context.readout("範囲のセルの数", `${w * h}`);
        context.readout("ひと続きの区間の数", `${runs}`);
        context.readout(
          "最初〜最後の番号の幅",
          `${firstSelected} 〜 ${lastSelected}（${lastSelected - firstSelected + 1} 個）`
        );
        context.caption(
          order === "morton"
            ? "モートン符号の順にたどると、Z の字が大きさを変えながらくり返す。2 次元で近いセルは、一列にしても近い番号になりやすいので、範囲のセルが少ない数のひと続きの区間にまとまる。ソートしてメモリに並べると、近くの粒子をまとめて読み込める。"
            : "行ごとに並べると、横に隣り合うセルは近い番号になるが、縦に隣り合うセルは 16 も離れる。範囲の高さの分だけ区間が分かれてしまう。"
        );
      },
      dispose() {
        cells.dispose();
        strip.dispose();
      },
    };
  },
};
