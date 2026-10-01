import {
  Color,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
} from "three";
import type { Vector3 } from "three";
import { arenaMap, at, lineOfSight, npc, playerTarget } from "../../arena";
import { palette, polyline, ramp, standard } from "../../kit";
import { BODY } from "../../mannequin";
import {
  cellAt,
  cellCenter,
  gridSearch,
  gridView,
  walkable,
} from "../../navgrid";
import type { DemoModule } from "../../types";

type Item = {
  position: Vector3;
  hidden: boolean;
  reachable: boolean;
  near: number;
  range: number;
  score: number;
  passed: boolean;
};

export const demo: DemoModule = {
  alt: "周りの候補地点を評価して、隠れる場所を選ぶ環境クエリ（EQS）のデモ。味方の兵士（青）の周りに格子状の候補点を並べ、テストをかける。「敵から見えない」は、敵（緑の球）から候補点まで壁にさえぎられているかを調べるふるいで、見えてしまう点は捨てる（灰色）。「自分から近い」「敵から適度に離れる」は得点で、合計がいちばん高い点（白い輪）へ走る。敵を動かすと、クエリがやり直され、兵士は次の物陰へ移る。",
  camera: { position: [0, 10.5, 7.5], target: [0, 0, 0.4], fov: 42 },
  controls: [
    {
      type: "toggle",
      key: "hidden",
      label: "ふるい：敵から見えない",
      value: true,
    },
    {
      type: "toggle",
      key: "near",
      label: "得点：自分から近い（経路の長さ）",
      value: true,
    },
    {
      type: "toggle",
      key: "range",
      label: "得点：敵から 4 m くらい離れる",
      value: true,
    },
    {
      type: "select",
      key: "view",
      label: "色で見る得点",
      value: "total",
      options: [
        { value: "total", label: "合計" },
        { value: "near", label: "近さ" },
        { value: "range", label: "敵との距離" },
      ],
    },
    {
      type: "range",
      key: "radius",
      label: "探す半径",
      min: 2,
      max: 7,
      step: 0.5,
      value: 5,
    },
  ],
  legend: [
    { color: palette.lime, label: "得点が高い候補 / 敵（ドラッグで動かせる）" },
    { color: palette.coral, label: "得点が低い候補" },
    { color: "#161b24", label: "ふるいで捨てた候補（敵から見える）" },
    { color: palette.ink, label: "選ばれた地点" },
  ],
  hint: "緑の球（敵）をドラッグすると、兵士が隠れる場所を選び直します",
  setup(context) {
    const { scene, params } = context;
    const map = arenaMap();
    const view = gridView(map, { wallHeight: 0.8 });
    scene.add(view);
    const soldier = npc(context, map, {
      accent: palette.sky,
      range: 0.01,
      fov: 0.01,
    });
    soldier.cone.visible = false;
    soldier.root.position.copy(at(map, 12, 12));
    const enemy = playerTarget(context, map, [
      at(map, 20, 5),
      at(map, 20, 12),
      at(map, 4, 12),
      at(map, 4, 9),
      at(map, 15, 9),
      at(map, 15, 5),
    ]);
    const maxItems = map.cols * map.rows;
    const dots = new InstancedMesh(
      new CylinderGeometry(0.11, 0.11, 0.05, 12),
      standard("#ffffff", { roughness: 0.6, emissive: 0.2 }),
      maxItems
    );
    dots.count = 0;
    dots.frustumCulled = false;
    scene.add(dots);
    const bestRing = new Mesh(
      new RingGeometry(0.2, 0.28, 32),
      new MeshBasicMaterial({ color: palette.ink })
    );
    bestRing.rotation.x = -Math.PI / 2;
    scene.add(bestRing);
    const sightLine = polyline([], palette.lime, {
      width: 1.5,
      opacity: 0.6,
      dashed: true,
    });
    scene.add(sightLine);

    const matrix = new Matrix4();
    const gray = new Color("#161b24");
    let items: Item[] = [];
    let best: Item | null = null;
    let timer = 0;

    const query = () => {
      const radius = Number(params["radius"]);
      const origin = soldier.position.clone();
      const start = cellAt(map, origin.x, origin.z);
      // 経路の長さは、兵士の位置から 1 回だけダイクストラ法で求める
      const field = walkable(map, start)
        ? gridSearch(map, [start], -1, { mode: "dijkstra", diagonal: true }).g
        : null;
      const target = enemy.position.clone().setY(0);
      items = [];
      for (let index = 0; index < map.blocked.length; index++) {
        if (!walkable(map, index)) {
          continue;
        }
        const position = cellCenter(map, index);
        if (position.distanceTo(origin) > radius) {
          continue;
        }
        const pathLength =
          (field?.[index] ?? Number.POSITIVE_INFINITY) * map.cell;
        const toEnemy = position.distanceTo(target);
        items.push({
          position,
          hidden: !lineOfSight(map, target, position),
          reachable: pathLength < radius * 1.6,
          near: Math.max(0, 1 - pathLength / (radius * 1.6)),
          range: Math.max(0, 1 - Math.abs(toEnemy - 4) / 4),
          score: 0,
          passed: false,
        });
      }
      const useNear = params["near"] === true;
      const useRange = params["range"] === true;
      const weights = (useNear ? 1 : 0) + (useRange ? 1 : 0);
      best = null;
      for (const item of items) {
        item.passed =
          item.reachable && (params["hidden"] !== true || item.hidden);
        item.score =
          weights === 0
            ? 0.5
            : ((useNear ? item.near : 0) + (useRange ? item.range : 0)) /
              weights;
        if (item.passed && (!best || item.score > best.score)) {
          best = item;
        }
      }
      if (best && best.position.distanceTo(soldier.position) > 0.3) {
        soldier.goTo(best.position);
      }
    };

    return {
      update({ dt }) {
        enemy.update(dt, !enemy.dragging);
        timer -= dt;
        if (timer <= 0) {
          timer = 0.4;
          query();
        }
        if (soldier.arrived) {
          soldier.face(enemy.position);
        }
        soldier.update(dt, 2.2);
        const safe = !lineOfSight(
          map,
          enemy.position.clone().setY(0),
          soldier.position
        );
        soldier.setIcon(safe ? "" : "!");
        // 隠れている間はしゃがむ
        if (soldier.arrived) {
          soldier.man.hips.position.y = safe ? 0.7 : BODY.hipHeight;
        }

        const viewKey = String(params["view"]);
        for (const [i, item] of items.entries()) {
          matrix.makeTranslation(item.position.x, 0.03, item.position.z);
          dots.setMatrixAt(i, matrix);
          const value =
            viewKey === "near"
              ? item.near
              : viewKey === "range"
                ? item.range
                : item.score;
          dots.setColorAt(
            i,
            item.passed
              ? ramp(value, [palette.coral, palette.amber, palette.lime])
              : gray
          );
        }
        dots.count = items.length;
        dots.instanceMatrix.needsUpdate = true;
        if (dots.instanceColor) {
          dots.instanceColor.needsUpdate = true;
        }
        bestRing.visible = best !== null;
        if (best) {
          bestRing.position.copy(best.position).setY(0.07);
        }
        const eye = enemy.position.clone().setY(0.4);
        sightLine.setPoints([eye, soldier.position.clone().setY(0.4)]);
        sightLine.visible = !safe;
        const passed = items.filter((item) => item.passed).length;
        context.readout("候補の数", `${items.length}`);
        context.readout("ふるいを通った候補", `${passed}`);
        context.readout("兵士", safe ? "隠れている" : "敵から見えている");
        context.caption(
          params["hidden"] === true
            ? "候補点を並べ（生成）、敵から見える点をふるいで捨て（灰色）、残りに得点を付けて最高点を選ぶ。敵が動くと見える範囲が変わるので、0.4 秒ごとにクエリをやり直し、兵士は次の物陰へ走る。"
            : "「敵から見えない」のふるいを外すと、敵から丸見えの場所でも得点が高ければ選んでしまう。隠れ場所を探すには、見えるかどうかのテストが欠かせない。"
        );
      },
      dispose() {
        view.dispose();
        dots.dispose();
      },
    };
  },
};
