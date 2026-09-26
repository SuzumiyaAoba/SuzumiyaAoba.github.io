import {
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import { palette, polyline, segments, standard } from "../../kit";
import { handle } from "../../widgets";
import type { DemoModule } from "../../types";

const HEIGHT = 0.35;
const SPAN_SAMPLES = 24;
const CARS = 14;

/** 両端でクランプした一様ノット列。 */
function clampedKnots(count: number, degree: number) {
  const knots: number[] = [];
  const spans = count - degree;
  for (let index = 0; index <= count + degree; index++) {
    knots.push(Math.min(Math.max(index - degree, 0), spans));
  }
  return knots;
}

/** de Boor のアルゴリズムで B スプライン上の点を求める。 */
function deBoor(
  points: readonly Vector3[],
  knots: readonly number[],
  degree: number,
  u: number,
  out: Vector3
) {
  const spans = points.length - degree;
  const clampedU = Math.min(Math.max(u, 0), spans - 1e-6);
  const k = Math.floor(clampedU) + degree;
  const d: Vector3[] = [];
  for (let j = 0; j <= degree; j++) {
    d.push((points[j + k - degree] ?? new Vector3()).clone());
  }
  for (let r = 1; r <= degree; r++) {
    for (let j = degree; j >= r; j--) {
      const left = knots[j + k - degree] ?? 0;
      const right = knots[j + 1 + k - r] ?? 1;
      const alpha = (clampedU - left) / Math.max(1e-6, right - left);
      const previous = d[j - 1];
      const current = d[j];
      if (previous && current) {
        current.multiplyScalar(alpha).addScaledVector(previous, 1 - alpha);
      }
    }
  }
  return out.copy(d[degree] ?? new Vector3());
}

export const demo: DemoModule = {
  alt: "10 個の制御点で作った長い走行コース。制御点を 1 つ動かすと、その点が影響する数区間だけが黄色く強調されて形が変わり、それ以外の区間はまったく動かない。コースの上を小さな列車が走る。",
  camera: { position: [0, 9, 8], target: [0, 0, 0.4] },
  controls: [
    {
      type: "select",
      key: "degree",
      label: "次数",
      value: "3",
      options: [
        { value: "1", label: "1 次（折れ線）" },
        { value: "2", label: "2 次" },
        { value: "3", label: "3 次" },
      ],
      hint: "次数 p の B スプラインでは、1 つの制御点が影響するのは p+1 区間だけです。",
    },
    { type: "toggle", key: "polygon", label: "制御ポリゴン", value: true },
    { type: "toggle", key: "train", label: "列車を走らせる", value: true },
  ],
  legend: [
    { color: palette.amber, label: "選んだ制御点が影響する区間" },
    { color: palette.cyan, label: "影響しない区間" },
  ],
  hint: "白い制御点をドラッグしてください。どの点を動かしても、形が変わるのは近くの区間だけです。",
  setup(context) {
    const { scene, params } = context;
    const points = [
      [-5, -2.6],
      [-3.6, 0.4],
      [-4.4, 2.8],
      [-1.6, 3.2],
      [-0.6, 0.6],
      [1.2, -1.8],
      [2.4, 1.4],
      [4.4, 3],
      [5.2, 0.2],
      [3.4, -3],
    ].map(([x, z]) => new Vector3(x, HEIGHT, z));
    let active = 4;
    const handles = points.map((point, index) => {
      const item = handle(palette.ink, 0.12);
      item.position.copy(point);
      scene.add(item);
      context.draggable(item, {
        clamp: (position) => {
          position.y = HEIGHT;
          position.x = Math.max(-6, Math.min(6, position.x));
          position.z = Math.max(-4, Math.min(4, position.z));
        },
        onDrag: (position) => {
          point.copy(position);
          active = index;
        },
      });
      return item;
    });
    const polygon = polyline(points, palette.muted, {
      width: 1.2,
      dashed: true,
      dashSize: 0.14,
      gapSize: 0.1,
      opacity: 0.7,
    });
    const affected = segments([], palette.amber, { width: 5 });
    const calm = segments([], palette.cyan, { width: 3 });
    const knotsDots = segments([], palette.ink, { width: 2 });
    scene.add(polygon, affected, calm, knotsDots);

    const cars = new InstancedMesh(
      new BoxGeometry(0.32, 0.2, 0.18),
      standard(palette.coral, { roughness: 0.4, metalness: 0.3 }),
      CARS
    );
    cars.castShadow = true;
    scene.add(cars);
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const scale = new Vector3(1, 1, 1);
    const position = new Vector3();
    const ahead = new Vector3();
    const xAxis = new Vector3(1, 0, 0);
    let clock = 0;

    return {
      update({ dt }) {
        const degree = Number(params["degree"]);
        const knots = clampedKnots(points.length, degree);
        const spans = points.length - degree;
        const first = Math.max(0, active - degree);
        const last = Math.min(spans - 1, active);
        const hot: Vector3[] = [];
        const cold: Vector3[] = [];
        const ticks: Vector3[] = [];
        for (let span = 0; span < spans; span++) {
          const target = span >= first && span <= last ? hot : cold;
          let previous = deBoor(points, knots, degree, span, new Vector3());
          ticks.push(
            previous.clone().setY(HEIGHT - 0.12),
            previous.clone().setY(HEIGHT + 0.12)
          );
          for (let sample = 1; sample <= SPAN_SAMPLES; sample++) {
            const next = deBoor(
              points,
              knots,
              degree,
              span + sample / SPAN_SAMPLES,
              new Vector3()
            );
            target.push(previous, next);
            previous = next;
          }
        }
        affected.setPoints(hot);
        calm.setPoints(cold);
        knotsDots.setPoints(ticks);
        polygon.setPoints(points);
        polygon.visible = params["polygon"] === true;
        for (const [index, item] of handles.entries()) {
          item.position.copy(points[index] ?? item.position);
          item.scale.setScalar(index === active ? 1.35 : 1);
        }

        cars.visible = params["train"] === true;
        if (cars.visible) {
          clock += dt * 0.9;
          for (let index = 0; index < CARS; index++) {
            const u = (((clock - index * 0.12) % spans) + spans) % spans;
            deBoor(points, knots, degree, u, position);
            deBoor(points, knots, degree, Math.min(spans, u + 0.02), ahead);
            const direction = ahead.sub(position).setY(0).normalize();
            rotation.setFromUnitVectors(
              xAxis,
              direction.lengthSq() > 0 ? direction : xAxis
            );
            matrix.compose(position.setY(HEIGHT + 0.12), rotation, scale);
            cars.setMatrixAt(index, matrix);
          }
          cars.instanceMatrix.needsUpdate = true;
        }

        context.readout("制御点", `${points.length} 個`);
        context.readout("区間の数", `${spans}`);
        context.readout(
          `点 ${active + 1} が影響する区間`,
          `${last - first + 1} 区間`
        );
        context.caption(
          "B スプラインの各点は、近くの制御点 p+1 個の重み付き平均。制御点を動かしても形が変わるのは局所的で、長いコースを部分ごとに調整できる。"
        );
      },
    };
  },
};
