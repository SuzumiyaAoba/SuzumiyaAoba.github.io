import { ConeGeometry, Mesh, Vector3 } from "three";
import { crowd } from "../../agents";
import { palette, polyline, ramp, rng, standard } from "../../kit";
import { mannequin } from "../../mannequin";
import {
  cellAt,
  cellCenter,
  gridSearch,
  gridView,
  neighbors,
  parseMap,
  walkable,
  walker,
} from "../../navgrid";
import type { DemoModule } from "../../types";

const LEVEL = [
  "........................",
  "..,,,,.......#......~~~.",
  "..,,,,.......#......~~~.",
  "..,,,,.......#..........",
  ".............#....,,,,..",
  "....####.....#....,,,,..",
  ".......#..........,,,,..",
  ".......#................",
  ".......#.....~~~~.......",
  ".......#.....~~~~..###..",
  ".............~~~~....#..",
  "..~~~~...............#..",
  "..~~~~.....,,,,,.....#..",
  "...........,,,,,........",
  "........................",
  "........................",
];
const AGENTS = 140;

type Mode = "range" | "field";

export const demo: DemoModule = {
  alt: "ダイクストラ法で、スタートからの累積コストが小さい順に地図を広げていくデモ。タクティクスゲームの移動範囲では、移動力の範囲に収まるセルが、平地・林・沼のコストに応じてゆがんだ形に広がる。カーソルを乗せたセルまでの最短経路と、その合計コストがわかる。距離の場のモードでは、ゴールから全体へダイクストラ法を 1 回だけ行い、各セルのゴールまでの距離を求める。大勢のユニットは、距離が小さくなる隣のセルへ進むだけで、それぞれ最短経路でゴールへ向かう。",
  camera: { position: [0, 11, 7.6], target: [0, 0, 0.3], fov: 42 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "使い方",
      value: "range",
      options: [
        { value: "range", label: "移動範囲（タクティクス）" },
        { value: "field", label: "距離の場で大勢を誘導" },
      ],
    },
    {
      type: "range",
      key: "budget",
      label: "移動力",
      min: 2,
      max: 14,
      step: 1,
      value: 7,
    },
    {
      type: "range",
      key: "speed",
      label: "広がる速さ（コスト / 秒）",
      min: 1,
      max: 30,
      step: 1,
      value: 6,
    },
  ],
  legend: [
    { color: palette.sky, label: "移動できるセル（色が濃いほど近い）" },
    { color: palette.coral, label: "カーソルのセルまでの最短経路" },
    { color: "#2d5a3c", label: "林（コスト 2）" },
    { color: "#4d4330", label: "沼（コスト 4）" },
  ],
  hint: "移動範囲：セルにカーソルを乗せると経路、クリックでそこへ移動。距離の場：クリックでゴールを置く",
  setup(context) {
    const { scene, params } = context;
    const map = parseMap(LEVEL, 0.55);
    const view = gridView(map);
    scene.add(view);
    const man = mannequin({ accent: palette.amber });
    scene.add(man.root);
    const unit = walker(man, { speed: 1.8 });
    let home = 7 * map.cols + 11;
    unit.setPath([cellCenter(map, home)]);
    const flag = new Mesh(
      new ConeGeometry(0.16, 0.5, 16),
      standard(palette.coral, { emissive: 0.5 })
    );
    scene.add(flag);
    const pathLine = polyline([], palette.coral, { width: 4 });
    scene.add(pathLine);
    const costLabel = context.label("", { tone: "strong" });
    scene.add(costLabel);
    const units = crowd(AGENTS, palette.amber, { emissive: 0.25 });
    scene.add(units);

    const random = rng(6);
    let goal = 2 * map.cols + 21;
    let search = gridSearch(map, [home], -1, {
      mode: "dijkstra",
      diagonal: true,
      limit: 7,
    });
    let front = 0;
    let signature = "";
    let moving = false;
    const positions = Array.from({ length: AGENTS }, () => new Vector3());
    const velocities = Array.from({ length: AGENTS }, () => new Vector3());
    const spawn = (index: number) => {
      for (let tries = 0; tries < 100; tries++) {
        const cell = Math.floor(random() * map.blocked.length);
        if (walkable(map, cell)) {
          const position = positions[index];
          position?.copy(cellCenter(map, cell));
          position?.add(
            new Vector3((random() - 0.5) * 0.4, 0, (random() - 0.5) * 0.4)
          );
          return;
        }
      }
    };
    for (let i = 0; i < AGENTS; i++) {
      spawn(i);
    }

    const recompute = (mode: Mode) => {
      search =
        mode === "range"
          ? gridSearch(map, [home], -1, {
              mode: "dijkstra",
              diagonal: true,
              limit: Number(params["budget"]),
            })
          : gridSearch(map, [goal], -1, { mode: "dijkstra", diagonal: true });
      front = 0;
    };
    context.onPick((point) => {
      const cell = cellAt(map, point.x, point.z);
      if (!walkable(map, cell)) {
        return;
      }
      if (params["mode"] === "field") {
        goal = cell;
        recompute("field");
        return;
      }
      const cost = search.g[cell] ?? Number.POSITIVE_INFINITY;
      if (moving || !Number.isFinite(cost) || cell === home) {
        return;
      }
      const route: Vector3[] = [];
      for (let at = cell; at >= 0; at = search.parent[at] ?? -1) {
        route.push(cellCenter(map, at));
      }
      unit.setPath(route.toReversed());
      home = cell;
      moving = true;
      pathLine.visible = false;
      costLabel.visible = false;
    });

    const maxField = () => {
      let max = 1;
      for (const value of search.g) {
        if (Number.isFinite(value)) {
          max = Math.max(max, value);
        }
      }
      return max;
    };
    let fieldMax = 1;

    return {
      update({ dt }) {
        const mode: Mode = params["mode"] === "field" ? "field" : "range";
        const next = `${mode}|${String(params["budget"])}`;
        if (next !== signature) {
          signature = next;
          recompute(mode);
          fieldMax = maxField();
        }
        front += dt * Number(params["speed"]);
        const limit = mode === "range" ? Number(params["budget"]) : fieldMax;
        const shown = Math.min(front, limit + 0.01);
        for (let index = 0; index < map.blocked.length; index++) {
          if (!walkable(map, index)) {
            continue;
          }
          const g = search.g[index] ?? Number.POSITIVE_INFINITY;
          if (g > shown) {
            view.tint(index, null);
          } else if (mode === "range") {
            view.tint(index, palette.sky, 0.75 - (g / limit) * 0.45);
          } else {
            view.tint(
              index,
              ramp(1 - g / fieldMax, [
                "#1b2a3d",
                palette.violet,
                palette.sky,
                palette.cyan,
              ]),
              0.8
            );
          }
        }
        view.commit();

        man.root.visible = mode === "range";
        units.visible = mode === "field";
        flag.visible = mode === "field";
        pathLine.visible = false;
        costLabel.visible = false;
        if (mode === "range") {
          if (moving) {
            const { done } = unit.update(dt);
            if (done) {
              moving = false;
              recompute("range");
            }
          } else {
            unit.update(0);
            const point = context.pointerOnPlane();
            const cell = point ? cellAt(map, point.x, point.z) : -1;
            const cost =
              cell >= 0
                ? (search.g[cell] ?? Number.POSITIVE_INFINITY)
                : Number.POSITIVE_INFINITY;
            if (Number.isFinite(cost) && cost <= shown && cell !== home) {
              const route: Vector3[] = [];
              for (let at = cell; at >= 0; at = search.parent[at] ?? -1) {
                route.push(cellCenter(map, at).setY(0.1));
              }
              pathLine.setPoints(route);
              pathLine.visible = true;
              costLabel.setText(`コスト ${cost.toFixed(1)}`);
              costLabel.position.copy(cellCenter(map, cell)).setY(0.6);
              costLabel.visible = true;
            }
          }
          let reachable = 0;
          for (const value of search.g) {
            if (Number.isFinite(value)) {
              reachable++;
            }
          }
          context.readout("移動できるセル", `${reachable}`);
          context.readout("調べたセル", `${search.order.length}`);
          context.caption(
            "移動力の範囲で、累積コストが小さい順にセルを確定していく。林（2）や沼（4）を通るとコストがかさむので、範囲は菱形でも円でもなく、地形に合わせてゆがむ。確定したセルには「どこから来たか」が記録されているので、どのセルへの最短経路もすぐに取り出せる。"
          );
          return;
        }

        flag.position.copy(cellCenter(map, goal)).setY(0.3);
        const center = new Vector3();
        for (let i = 0; i < AGENTS; i++) {
          const position = positions[i];
          const velocity = velocities[i];
          if (!position || !velocity) {
            continue;
          }
          const cell = cellAt(map, position.x, position.z);
          if (cell === goal || !walkable(map, cell)) {
            spawn(i);
            continue;
          }
          // 距離の場を下る：隣のセルのうち、ゴールまでの距離がいちばん小さいものへ向かう
          let best = cell;
          let bestValue = search.g[cell] ?? Number.POSITIVE_INFINITY;
          for (const [neighbor] of neighbors(map, cell, true)) {
            const value = search.g[neighbor] ?? Number.POSITIVE_INFINITY;
            if (value < bestValue) {
              bestValue = value;
              best = neighbor;
            }
          }
          cellCenter(map, best, center);
          const desired = center.sub(position).setY(0);
          const length = desired.length();
          if (length > 1e-4) {
            desired.multiplyScalar(1.4 / length);
          }
          velocity.lerp(desired, Math.min(1, dt * 6));
          position.addScaledVector(velocity, dt);
          const after = cellAt(map, position.x, position.z);
          if (!walkable(map, after)) {
            position.addScaledVector(velocity, -dt);
          }
          units.set(i, position.clone().setY(0.12), velocity);
        }
        units.commit();
        context.readout("移動できるセル", "");
        context.readout("調べたセル", `${search.order.length}（1 回だけ）`);
        context.caption(
          "ゴールから地図全体へダイクストラ法を 1 回だけ行い、各セルの「ゴールまでの最短距離」を求めた（色が明るいほど近い）。どのユニットも、距離が小さくなる隣のセルへ進むだけで、最短経路でゴールへ着く。何百体いても探索は 1 回で済む（フローフィールド）。"
        );
      },
      dispose() {
        view.dispose();
      },
    };
  },
};
