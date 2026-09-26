import {
  BoxGeometry,
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, polyline, standard, trail } from "../../kit";
import { hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const TICKS = 24;
const LAP = 9;

function car(color: string) {
  const group = new Group();
  const body = new Mesh(
    new BoxGeometry(0.5, 0.18, 0.28),
    standard(color, { roughness: 0.35, metalness: 0.4 })
  );
  body.position.y = 0.16;
  const cabin = new Mesh(
    new BoxGeometry(0.24, 0.14, 0.22),
    standard("#1b2230", { roughness: 0.2, metalness: 0.6 })
  );
  cabin.position.set(-0.04, 0.3, 0);
  group.add(body, cabin);
  group.traverse((child) => {
    child.castShadow = true;
  });
  return group;
}

export const demo: DemoModule = {
  alt: "同じ曲線コースを走る 2 台の車。パラメータ t を一定に増やす赤い車は、制御点が詰まった区間で遅く、間隔の広い直線で急加速する。弧長で位置を決める水色の車は常に同じ速さで走る。",
  camera: { position: [0, 9.5, 7.5], target: [0, 0, 0.3] },
  controls: [
    {
      type: "range",
      key: "samples",
      label: "弧長テーブルの分割数",
      min: 3,
      max: 200,
      step: 1,
      value: 100,
      hint: "少ないほど弧長の近似が粗くなり、水色の車にも速度むらが出ます。",
    },
    { type: "toggle", key: "ticks", label: "等間隔の目盛り", value: true },
  ],
  legend: [
    { color: palette.coral, label: "t を一定に増やす" },
    { color: palette.cyan, label: "弧長で位置を決める" },
  ],
  setup(context) {
    const { scene, params } = context;
    const curve = new CatmullRomCurve3(
      [
        new Vector3(-4.8, 0.02, -1.6),
        new Vector3(-4.2, 0.02, 1.8),
        new Vector3(-3.6, 0.02, 2.4),
        new Vector3(-2.9, 0.02, 2.6),
        new Vector3(3.8, 0.02, 2.4),
        new Vector3(4.6, 0.02, -0.4),
        new Vector3(1.2, 0.02, -2.6),
      ],
      true,
      "catmullrom",
      0.5
    );
    const road = polyline(curve.getPoints(400), "#3a4658", { width: 22 });
    const center = polyline(
      curve.getPoints(400).map((point) => point.clone().setY(0.03)),
      palette.muted,
      {
        width: 1,
        dashed: true,
        dashSize: 0.2,
        gapSize: 0.2,
        opacity: 0.6,
      }
    );
    scene.add(road, center);

    const red = car(palette.coral);
    const blue = car(palette.cyan);
    const redTrail = trail(40, palette.coral, { width: 3 });
    const blueTrail = trail(40, palette.cyan, { width: 3 });
    scene.add(red, blue, redTrail, blueTrail);

    const tickGeometry = new SphereGeometry(0.07, 12, 8);
    const rawTicks = new InstancedMesh(
      tickGeometry,
      standard(palette.coral, { emissive: 0.6 }),
      TICKS
    );
    const evenTicks = new InstancedMesh(
      tickGeometry,
      standard(palette.cyan, { emissive: 0.6 }),
      TICKS
    );
    scene.add(rawTicks, evenTicks);

    const graph = hudGraph(context, {
      title: "パラメータ t と進んだ距離 s",
      xLabel: "t",
    });
    const matrix = new Matrix4();
    const position = new Vector3();
    const previousRed = new Vector3();
    const previousBlue = new Vector3();
    const offset = new Vector3();
    let clock = 0;
    let table: number[] = [];
    let lastSamples = 0;

    /** 弧長テーブル：t = i/N までの累積距離。 */
    const buildTable = (count: number) => {
      const lengths = [0];
      const previous = curve.getPoint(0);
      const point = new Vector3();
      for (let index = 1; index <= count; index++) {
        curve.getPoint(index / count, point);
        lengths.push((lengths[index - 1] ?? 0) + point.distanceTo(previous));
        previous.copy(point);
      }
      return lengths;
    };
    /** 距離 s（0〜1 の割合）から t を二分探索と線形補間で逆引きする。 */
    const tFromDistance = (fraction: number) => {
      const total = table.at(-1) ?? 1;
      const target = fraction * total;
      let low = 0;
      let high = table.length - 1;
      while (low < high - 1) {
        const middle = (low + high) >> 1;
        if ((table[middle] ?? 0) < target) {
          low = middle;
        } else {
          high = middle;
        }
      }
      const a = table[low] ?? 0;
      const b = table[high] ?? total;
      const count = table.length - 1;
      return (low + (target - a) / Math.max(1e-6, b - a)) / count;
    };
    const placeCar = (object: Group, t: number) => {
      curve.getPoint(t, position);
      curve.getPoint(Math.min(1, t + 0.002), offset);
      object.position.copy(position);
      object.lookAt(offset.setY(position.y));
      object.rotateY(-Math.PI / 2);
    };

    return {
      update({ dt }) {
        const samples = Number(params["samples"]);
        if (samples !== lastSamples) {
          table = buildTable(samples);
          lastSamples = samples;
          const exact = buildTable(400);
          const total = exact.at(-1) ?? 1;
          graph.setSeries([
            {
              fn: (t) => (exact[Math.round(t * 400)] ?? 0) / total,
              color: palette.amber,
              label: "s(t)（正規化）",
            },
            {
              fn: (t) => t,
              color: palette.muted,
              label: "等速なら直線",
              dashed: true,
            },
          ]);
        }
        clock = (clock + dt / LAP) % 1;
        previousRed.copy(red.position);
        previousBlue.copy(blue.position);
        placeCar(red, clock);
        placeCar(blue, tFromDistance(clock));
        redTrail.push(red.position.clone().setY(0.2));
        blueTrail.push(blue.position.clone().setY(0.2));
        graph.setMarker(clock);

        const showTicks = params["ticks"] === true;
        rawTicks.visible = showTicks;
        evenTicks.visible = showTicks;
        if (showTicks) {
          for (let index = 0; index < TICKS; index++) {
            curve.getPoint(index / TICKS, position);
            matrix.makeTranslation(position.x, 0.5, position.z);
            rawTicks.setMatrixAt(index, matrix);
            curve.getPoint(tFromDistance(index / TICKS), position);
            matrix.makeTranslation(position.x, 0.75, position.z);
            evenTicks.setMatrixAt(index, matrix);
          }
          rawTicks.instanceMatrix.needsUpdate = true;
          evenTicks.instanceMatrix.needsUpdate = true;
        }
        if (dt > 0) {
          context.readout(
            "赤の速さ",
            `${(red.position.distanceTo(previousRed) / dt).toFixed(2)} m/s`
          );
          context.readout(
            "水色の速さ",
            `${(blue.position.distanceTo(previousBlue) / dt).toFixed(2)} m/s`
          );
        }
        context.caption(
          "t を等間隔に進めても、進む距離は等間隔にならない。弧長テーブルで『距離 → t』を逆引きすると、一定の速さで走らせられる。"
        );
      },
    };
  },
};
