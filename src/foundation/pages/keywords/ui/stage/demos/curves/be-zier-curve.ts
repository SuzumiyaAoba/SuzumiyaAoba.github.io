import { CylinderGeometry, Mesh, Vector3 } from "three";
import {
  marker,
  palette,
  polyline,
  segments,
  standard,
  trail,
} from "../../kit";
import { handle } from "../../widgets";
import type { DemoModule } from "../../types";

const SAMPLES = 90;
const levelColors = [palette.muted, palette.sky, palette.violet, palette.amber];

/** De Casteljau のアルゴリズム。各段の点列を返す（最後の段が曲線上の点）。 */
function deCasteljau(points: readonly Vector3[], t: number) {
  const levels: Vector3[][] = [points.map((point) => point.clone())];
  let current = levels[0] ?? [];
  while (current.length > 1) {
    const next: Vector3[] = [];
    for (let index = 0; index < current.length - 1; index++) {
      const a = current[index];
      const b = current[index + 1];
      if (a && b) {
        next.push(a.clone().lerp(b, t));
      }
    }
    levels.push(next);
    current = next;
  }
  return levels;
}

export const demo: DemoModule = {
  alt: "ジャンプする軌道をベジェ曲線で描くデモ。制御点をドラッグすると軌道が変わり、制御点の間を同じ比率で分割していく De Casteljau の作図が色分けされた線で表示される。",
  camera: { position: [0.6, 3.2, 9.4], target: [0, 1.9, 0] },
  controls: [
    {
      type: "select",
      key: "degree",
      label: "次数",
      value: "3",
      options: [
        { value: "2", label: "2 次（制御点 3 個）" },
        { value: "3", label: "3 次（制御点 4 個）" },
      ],
    },
    {
      type: "range",
      key: "t",
      label: "t（手動）",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.4,
      hint: "「自動で動かす」をオフにすると、この t で作図を止めて観察できます。",
    },
    { type: "toggle", key: "auto", label: "自動で動かす", value: true },
    { type: "toggle", key: "construction", label: "作図の線", value: true },
  ],
  legend: [
    { color: palette.muted, label: "制御ポリゴン" },
    { color: palette.sky, label: "1 段目の分割点" },
    { color: palette.violet, label: "2 段目" },
    { color: palette.amber, label: "曲線上の点" },
  ],
  hint: "白い球（制御点）をドラッグできます。曲線は制御点を結んだ多角形の内側に収まります。",
  setup(context) {
    const { scene, params } = context;
    const controlPoints = [
      new Vector3(-3.6, 0.3, 0),
      new Vector3(-2, 4.2, 0),
      new Vector3(1.8, 4.4, 0),
      new Vector3(3.6, 0.3, 0),
    ];
    const labels: ReturnType<typeof context.label>[] = [];
    const handles = controlPoints.map((point, index) => {
      const item = handle(palette.ink, 0.13);
      item.position.copy(point);
      scene.add(item);
      context.draggable(item, {
        normal: [0, 0, 1],
        origin: [0, 0, 0],
        clamp: (position) => {
          position.z = 0;
          position.y = Math.max(0.1, Math.min(5.5, position.y));
          position.x = Math.max(-5, Math.min(5, position.x));
        },
        onDrag: (position) => controlPoints[index]?.copy(position),
      });
      const label = context.label(`P${index}`, { tone: "muted" });
      label.position.set(0, 0.32, 0);
      item.add(label);
      labels.push(label);
      return item;
    });
    const endLabel = labels[3] ?? context.label("P3");

    const pads = [0, 1].map(() => {
      const pad = new Mesh(
        new CylinderGeometry(0.55, 0.6, 0.2, 32),
        standard("#3b4a60", { roughness: 0.6 })
      );
      pad.receiveShadow = true;
      pad.castShadow = true;
      scene.add(pad);
      return pad;
    });

    const curve = polyline([], palette.amber, { width: 3 });
    const levelLines = levelColors.map((color, index) =>
      segments([], color, {
        width: index === 0 ? 1.5 : 1.8,
        opacity: index === 0 ? 0.7 : 0.9,
      })
    );
    const levelDots = levelColors.map((color) =>
      Array.from({ length: 4 }, () => {
        const dot = marker(color, 0.06);
        scene.add(dot);
        return dot;
      })
    );
    scene.add(curve, ...levelLines);
    const coin = new Mesh(
      new CylinderGeometry(0.28, 0.28, 0.07, 32),
      standard(palette.amber, {
        metalness: 0.9,
        roughness: 0.25,
        emissive: 0.15,
      })
    );
    coin.castShadow = true;
    const glow = trail(30, palette.amber, { width: 4 });
    scene.add(coin, glow);
    let clock = 0;
    let lastT = 0;

    return {
      update({ dt, time }) {
        const degree = Number(params["degree"]);
        for (const [index, item] of handles.entries()) {
          item.visible = degree === 3 || index !== 2;
          const point = controlPoints[index];
          if (point) {
            item.position.copy(point);
          }
        }
        endLabel.setText(degree === 2 ? "P2" : "P3");
        const pointsForCurve =
          degree === 2
            ? [controlPoints[0], controlPoints[1], controlPoints[3]]
            : controlPoints;
        const curvePoints = pointsForCurve.filter(
          (point): point is Vector3 => point !== undefined
        );
        const auto = params["auto"] === true;
        if (auto) {
          clock += dt * 0.45;
        }
        const t = auto
          ? (Math.sin(clock * Math.PI - Math.PI / 2) + 1) / 2
          : Number(params["t"]);
        if (auto && t < lastT - 0.5) {
          glow.reset();
        }
        lastT = t;

        const samples: Vector3[] = [];
        for (let sample = 0; sample <= SAMPLES; sample++) {
          const levels = deCasteljau(curvePoints, sample / SAMPLES);
          const last = levels.at(-1)?.[0];
          if (last) {
            samples.push(last);
          }
        }
        curve.setPoints(samples);

        const levels = deCasteljau(curvePoints, t);
        const showConstruction = params["construction"] === true;
        for (const [levelIndex, line] of levelLines.entries()) {
          const level = levels[levelIndex] ?? [];
          const pairs: Vector3[] = [];
          for (let index = 0; index < level.length - 1; index++) {
            const a = level[index];
            const b = level[index + 1];
            if (a && b) {
              pairs.push(a, b);
            }
          }
          line.visible =
            pairs.length > 0 && (levelIndex === 0 || showConstruction);
          if (line.visible) {
            line.setPoints(pairs);
          }
          for (const [dotIndex, dot] of (
            levelDots[levelIndex] ?? []
          ).entries()) {
            const point = level[dotIndex];
            dot.visible =
              levelIndex > 0 &&
              point !== undefined &&
              (showConstruction || levelIndex === levels.length - 1);
            if (point) {
              dot.position.copy(point);
            }
          }
        }
        const onCurve = levels.at(-1)?.[0];
        if (onCurve) {
          coin.position.copy(onCurve);
          coin.rotation.set(Math.PI / 2, time * 4, 0);
          glow.push(onCurve);
        }
        const [first] = curvePoints;
        const last = curvePoints.at(-1);
        if (first && last) {
          pads[0]?.position.set(first.x, 0.1, 0);
          pads[1]?.position.set(last.x, 0.1, 0);
        }

        context.readout("t", t.toFixed(2));
        context.readout("作図の段数", `${levels.length - 1} 段`);
        context.caption(
          "隣り合う制御点を t : 1−t に分ける操作を、点が 1 つになるまで繰り返す。最後に残った点が曲線上の位置。"
        );
      },
    };
  },
};
