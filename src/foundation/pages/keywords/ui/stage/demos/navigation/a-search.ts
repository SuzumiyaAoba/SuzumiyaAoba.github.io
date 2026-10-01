import { ConeGeometry, Mesh } from "three";
import { palette, polyline, rng, standard } from "../../kit";
import { mannequin } from "../../mannequin";
import {
  cellAt,
  cellCenter,
  gridSearch,
  gridView,
  parseMap,
  walkable,
  walker,
} from "../../navgrid";
import type { GridMap, SearchMode } from "../../navgrid";
import type { DemoModule } from "../../types";

const COLS = 30;
const ROWS = 18;

/** 真ん中に、スタート側へ口を開いた「コの字」の壁を置いた地図。 */
function level() {
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ".")
  );
  const fill = (c0: number, r0: number, c1: number, r1: number, ch: string) => {
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const row = grid[r];
        if (row) {
          row[c] = ch;
        }
      }
    }
  };
  fill(20, 1, 25, 4, ",");
  fill(8, 12, 13, 16, "~");
  fill(22, 12, 27, 14, "~");
  fill(3, 1, 7, 3, ",");
  fill(14, 3, 18, 3, "#");
  fill(18, 3, 18, 13, "#");
  fill(14, 13, 18, 13, "#");
  fill(6, 6, 6, 11, "#");
  fill(23, 7, 27, 7, "#");
  fill(1, 14, 4, 14, "#");
  return parseMap(grid.map((row) => row.join("")));
}

const CAPTIONS: Record<SearchMode, string> = {
  dijkstra:
    "ダイクストラ法：スタートからの累積コスト g が小さい順に調べる。ゴールの方向を知らないので、全方向へ同心円状に広がり、多くのセルを調べてしまう。",
  astar:
    "A*：g に、ゴールまでの残り距離の見積もり h を足した f = g + h が小さい順に調べる。ゴールの方向へ伸びるように探し、しかも h が実際の残りコストを超えない限り、最短経路が保証される。",
  greedy:
    "最良優先探索：h だけで順番を決める。まっすぐゴールへ向かうので調べるセルは少ないが、コの字の壁の中に入り込んだり、沼を突っ切ったりして、最短ではない経路になりやすい。",
};

export const demo: DemoModule = {
  alt: "格子の地図の上で、スタートからゴールまでの経路を探す A* のデモ。水色のセルが調べ終えたセル、黄色が次の候補（オープンリスト）。ダイクストラ法はスタートから全方向へ広がるが、A* はゴールまでの残り距離の見積もりを足した値で順番を決めるので、ゴールの方向へ伸びるように探し、調べるセルが少なくて済む。残り距離だけで決める最良優先探索は速いが、コの字の壁に入り込み、最短でない経路を返す。林や沼は通るのに時間がかかる。地図をクリックするとゴールを変えられる。",
  camera: { position: [0, 10.5, 7.2], target: [0, 0, 0.3], fov: 42 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "探し方",
      value: "astar",
      options: [
        { value: "dijkstra", label: "ダイクストラ法（g だけ）" },
        { value: "astar", label: "A*（g + h）" },
        { value: "greedy", label: "最良優先（h だけ）" },
      ],
    },
    {
      type: "range",
      key: "weight",
      label: "見積もり h の重み（A*）",
      min: 1,
      max: 5,
      step: 0.1,
      value: 1,
      hint: "1 より大きいと速くなるが、最短の保証がなくなる",
    },
    { type: "toggle", key: "diagonal", label: "斜めに進める", value: true },
    {
      type: "range",
      key: "speed",
      label: "1 秒に調べるセルの数",
      min: 10,
      max: 600,
      step: 10,
      value: 80,
    },
    { type: "button", key: "again", label: "もう一度探す" },
  ],
  legend: [
    { color: palette.sky, label: "調べ終えたセル（クローズ）" },
    { color: palette.amber, label: "次の候補（オープン）" },
    { color: palette.coral, label: "見つかった経路" },
    { color: "#2d5a3c", label: "林（コスト 2）" },
    { color: "#4d4330", label: "沼（コスト 4）" },
  ],
  hint: "地図をクリックすると、そこをゴールにして探し直します",
  setup(context) {
    const { scene, params } = context;
    const map: GridMap = level();
    const view = gridView(map);
    scene.add(view);
    const man = mannequin({ accent: palette.amber });
    scene.add(man.root);
    const agent = walker(man, { speed: 1.6 });
    const flag = new Mesh(
      new ConeGeometry(0.14, 0.45, 16),
      standard(palette.coral, { emissive: 0.5 })
    );
    flag.castShadow = true;
    scene.add(flag);
    const pathLine = polyline([], palette.coral, { width: 4 });
    scene.add(pathLine);

    const random = rng(4);
    let start = 8 * COLS + 2;
    let goal = 8 * COLS + 27;
    agent.setPath([cellCenter(map, start)]);
    let result = gridSearch(map, [start], goal, {
      mode: "astar",
      diagonal: true,
    });
    let optimal = 0;
    let shown = 0;
    let pause = 0;
    let signature = "";
    let walking = false;

    const run = () => {
      const { mode } = params;
      const searchMode: SearchMode =
        mode === "dijkstra" || mode === "greedy" ? mode : "astar";
      const diagonal = params["diagonal"] === true;
      result = gridSearch(map, [start], goal, {
        mode: searchMode,
        diagonal,
        weight: Number(params["weight"]),
      });
      optimal =
        gridSearch(map, [start], goal, { mode: "dijkstra", diagonal }).g[
          goal
        ] ?? 0;
      shown = 0;
      walking = false;
      pathLine.visible = false;
      flag.position.copy(cellCenter(map, goal)).setY(0.3);
    };
    const retarget = (next: number) => {
      const here = cellAt(map, agent.position.x, agent.position.z);
      start = walkable(map, here) ? here : start;
      goal = next;
      agent.setPath([cellCenter(map, start)]);
      run();
    };
    context.onPick((point) => {
      const index = cellAt(map, point.x, point.z);
      if (walkable(map, index) && index !== start) {
        retarget(index);
      }
    });

    return {
      update({ dt }) {
        const next = `${String(params["mode"])}|${String(params["weight"])}|${String(params["diagonal"])}`;
        if (next !== signature) {
          signature = next;
          const here = cellAt(map, agent.position.x, agent.position.z);
          if (walkable(map, here)) {
            start = here;
          }
          agent.setPath([cellCenter(map, start)]);
          run();
        }
        const total = result.steps;
        if (shown < total) {
          shown = Math.min(total, shown + dt * Number(params["speed"]));
        }
        const step = Math.floor(shown);
        for (let index = 0; index < map.blocked.length; index++) {
          if (!walkable(map, index)) {
            continue;
          }
          const closed =
            (result.closedAt[index] ?? -1) >= 0 &&
            (result.closedAt[index] ?? 0) <= step;
          const open =
            !closed &&
            (result.openedAt[index] ?? -1) >= 0 &&
            (result.openedAt[index] ?? 0) <= step;
          if (closed) {
            view.tint(index, palette.sky, 0.45);
          } else if (open) {
            view.tint(index, palette.amber, 0.6);
          } else {
            view.tint(index, null);
          }
        }
        const finished = shown >= total;
        if (finished && !walking) {
          walking = true;
          const points = result.path.map((index) =>
            cellCenter(map, index).setY(0.02)
          );
          pathLine.setPoints(points.map((point) => point.clone().setY(0.1)));
          pathLine.visible = points.length > 1;
          for (const index of result.path) {
            view.tint(index, palette.coral, 0.55);
          }
          agent.setPath(points);
          pause = 0;
        }
        if (walking) {
          for (const index of result.path) {
            view.tint(index, palette.coral, 0.55);
          }
          const { done } = agent.update(dt);
          if (done) {
            pause += dt;
            if (pause > 1.6) {
              // 次のゴールを自動で選ぶ（スタートから遠い所）
              let candidate = goal;
              for (let tries = 0; tries < 200; tries++) {
                const index = Math.floor(random() * map.blocked.length);
                const far =
                  cellCenter(map, index).distanceTo(agent.position) > 5;
                if (walkable(map, index) && far) {
                  candidate = index;
                  break;
                }
              }
              retarget(candidate);
            }
          }
        } else {
          agent.update(0);
        }
        view.commit();
        const cost = result.g[goal] ?? 0;
        context.readout("調べたセル", `${Math.min(step, result.order.length)}`);
        context.readout(
          "経路のコスト（最短との比）",
          finished && Number.isFinite(cost)
            ? `${cost.toFixed(1)}（${((cost / Math.max(1e-6, optimal)) * 100).toFixed(0)}%）`
            : "—"
        );
        const { mode } = params;
        context.caption(
          CAPTIONS[mode === "dijkstra" || mode === "greedy" ? mode : "astar"]
        );
      },
      action(key) {
        if (key === "again") {
          run();
        }
      },
      dispose() {
        view.dispose();
      },
    };
  },
};
