import {
  arenaMap,
  at,
  diagramPanel,
  npc,
  playerTarget,
  randomWalkable,
  svg,
} from "../../arena";
import { gridView } from "../../navgrid";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";

const STATE_KEYS = ["patrol", "alert", "chase", "attack", "search"] as const;
type State = (typeof STATE_KEYS)[number];

const STATES: Record<
  State,
  { name: string; x: number; y: number; color: string; icon: string }
> = {
  patrol: { name: "巡回", x: 48, y: 100, color: palette.cyan, icon: "" },
  alert: { name: "警戒", x: 150, y: 34, color: palette.amber, icon: "?" },
  chase: { name: "追跡", x: 262, y: 100, color: palette.coral, icon: "!" },
  attack: { name: "攻撃", x: 262, y: 186, color: palette.pink, icon: "!!" },
  search: { name: "捜索", x: 150, y: 166, color: palette.violet, icon: "?" },
};

type Edge = { from: State; to: State; label: string; bend: number };
const EDGES: readonly Edge[] = [
  { from: "patrol", to: "alert", label: "見えた", bend: -18 },
  { from: "alert", to: "patrol", label: "2 秒見えない", bend: -18 },
  { from: "alert", to: "chase", label: "見え続けた", bend: -14 },
  { from: "chase", to: "attack", label: "近づいた", bend: -16 },
  { from: "attack", to: "chase", label: "離れた", bend: -16 },
  { from: "chase", to: "search", label: "見失った", bend: -14 },
  { from: "search", to: "chase", label: "見えた", bend: -14 },
  { from: "search", to: "patrol", label: "探し終えた", bend: -14 },
];

const CAPTIONS: Record<State, string> = {
  patrol:
    "巡回：決まった道を歩く。視界（扇形）にプレイヤーが入ったら「警戒」へ移る。状態ごとに、する行動と、次の状態へ移る条件だけを書けばよい。",
  alert:
    "警戒：立ち止まってプレイヤーの方を向き、見え続けたら「追跡」、2 秒見えなければ「巡回」へ戻る。いきなり追いかけず、気づくまでの間を作ると、プレイヤーに逃げる余地ができる。",
  chase:
    "追跡：プレイヤーへ走る。近づいたら「攻撃」、壁の陰に隠れて見失ったら、最後に見た位置を覚えて「捜索」へ移る。",
  attack:
    "攻撃：近くのプレイヤーを攻撃する。プレイヤーが離れたら「追跡」へ戻る（攻撃を受けたプレイヤーはスタート地点へ戻される）。",
  search:
    "捜索：最後に見た位置まで行き、周りを見回す。見つけたら「追跡」、しばらく探して見つからなければ「巡回」へ戻る。",
};

export const demo: DemoModule = {
  alt: "見張りの敵の行動を、有限状態機械（ステートマシン）で作るデモ。敵は、巡回・警戒・追跡・攻撃・捜索のどれか 1 つの状態にいて、状態ごとに決まった行動をとる。視界にプレイヤー（緑の球）が入る、見失う、近づくといった条件で、次の状態へ移る。右下の状態遷移図で、今の状態と、直前に通った矢印が光る。緑の球はドラッグして動かせる。",
  camera: { position: [0, 10.5, 7.5], target: [0, 0, 0.4], fov: 42 },
  controls: [
    {
      type: "range",
      key: "range",
      label: "視界の距離",
      min: 2,
      max: 8,
      step: 0.5,
      value: 4.5,
    },
    {
      type: "toggle",
      key: "auto",
      label: "プレイヤーを自動で動かす",
      value: true,
    },
  ],
  legend: [
    { color: palette.lime, label: "プレイヤー（ドラッグで動かせる）" },
    { color: palette.coral, label: "見張りと視界" },
    { color: palette.violet, label: "最後に見た位置" },
  ],
  hint: "緑の球をドラッグしてプレイヤーを動かせます",
  setup(context) {
    const { scene, params } = context;
    const map = arenaMap();
    const view = gridView(map, { wallHeight: 0.6 });
    scene.add(view);
    const guard = npc(context, map, { accent: palette.coral });
    const patrol = [
      at(map, 2, 9),
      at(map, 14, 9),
      at(map, 14, 13),
      at(map, 2, 13),
    ];
    guard.root.position.copy(patrol[0] ?? guard.root.position);
    const player = playerTarget(context, map, [
      at(map, 20, 5),
      at(map, 20, 12),
      at(map, 4, 12),
      at(map, 4, 9),
      at(map, 15, 9),
      at(map, 15, 5),
    ]);
    const lastSeen = randomWalkable(map, rng(1));
    const lastSeenMarker = context.label("最後に見た位置", {
      color: palette.violet,
    });
    scene.add(lastSeenMarker);

    // 状態遷移図
    const { root } = diagramPanel(context, {
      title: "状態遷移図",
      width: 310,
      height: 210,
      rem: 17,
    });
    const defs = svg("defs", {});
    const markerNode = svg("marker", {
      id: "fsm-arrow",
      viewBox: "0 0 10 10",
      refX: 9,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: "auto-start-reverse",
    });
    markerNode.append(
      svg("path", { d: "M0 0 L10 5 L0 10 z", fill: "context-stroke" })
    );
    defs.append(markerNode);
    root.append(defs);
    const edgeNodes = EDGES.map((edge) => {
      const a = STATES[edge.from];
      const b = STATES[edge.to];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const nx = -dy / length;
      const ny = dx / length;
      const r = 24;
      const sx = a.x + (dx / length) * r + nx * 6;
      const sy = a.y + (dy / length) * r + ny * 6;
      const ex = b.x - (dx / length) * (r + 2) + nx * 6;
      const ey = b.y - (dy / length) * (r + 2) + ny * 6;
      const cx = (a.x + b.x) / 2 + nx * edge.bend * -1;
      const cy = (a.y + b.y) / 2 + ny * edge.bend * -1;
      const path = svg("path", {
        d: `M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`,
        fill: "none",
        stroke: "#51607a",
        "stroke-width": 1.5,
        "marker-end": "url(#fsm-arrow)",
      });
      const label = svg(
        "text",
        {
          x: cx,
          y: cy + 3,
          "text-anchor": "middle",
          fill: "#8f9eb3",
          "font-size": 9,
        },
        edge.label
      );
      root.append(path, label);
      return { edge, path, label };
    });
    const stateNodes = STATE_KEYS.map((key) => {
      const state = STATES[key];
      const circle = svg("circle", {
        cx: state.x,
        cy: state.y,
        r: 24,
        fill: "#101826",
        stroke: state.color,
        "stroke-width": 2,
      });
      const text = svg(
        "text",
        {
          x: state.x,
          y: state.y + 4,
          "text-anchor": "middle",
          fill: "#e8eef6",
          "font-size": 12,
          "font-weight": 600,
        },
        state.name
      );
      root.append(circle, text);
      return { key, circle, text };
    });

    let state: State = "patrol";
    let timeInState = 0;
    let seenTime = 0;
    let unseenTime = 0;
    let waypoint = 0;
    let flash: Edge | null = null;
    let flashTime = 0;
    let hitTime = 0;
    let lookAround = 0;
    let lastSeenValid = false;

    const enter = (next: State) => {
      const edge = EDGES.find((e) => e.from === state && e.to === next) ?? null;
      flash = edge;
      flashTime = 1.2;
      state = next;
      timeInState = 0;
      seenTime = 0;
      unseenTime = 0;
      guard.setIcon(STATES[next].icon);
    };
    guard.setIcon("");

    return {
      update({ dt }) {
        player.update(dt, params["auto"] === true);
        const target = player.position.clone().setY(0);
        guard.cone.scale.setScalar(Number(params["range"]) / 4.5);
        const sees =
          guard.sees(target) &&
          guard.position.distanceTo(target) < Number(params["range"]);
        if (sees) {
          lastSeen.copy(target);
          lastSeenValid = true;
          seenTime += dt;
          unseenTime = 0;
        } else {
          unseenTime += dt;
        }
        timeInState += dt;
        const distance = guard.position.distanceTo(target);

        // 状態ごとの行動と、遷移の条件
        switch (state) {
          case "patrol": {
            const current = patrol[waypoint];
            if (current && guard.position.distanceTo(current) < 0.2) {
              waypoint = (waypoint + 1) % patrol.length;
            }
            const goal = patrol[waypoint];
            if (goal) {
              guard.goTo(goal);
            }
            guard.update(dt, 1.1);
            if (sees) {
              enter("alert");
            }
            break;
          }
          case "alert": {
            guard.stop();
            guard.face(target);
            guard.update(dt);
            if (seenTime > 0.8) {
              enter("chase");
            } else if (unseenTime > 2) {
              enter("patrol");
            }
            break;
          }
          case "chase": {
            guard.goTo(lastSeen);
            guard.update(dt, 2.1);
            if (distance < 0.9) {
              enter("attack");
            } else if (!sees && unseenTime > 0.3) {
              enter("search");
            }
            break;
          }
          case "attack": {
            guard.stop();
            guard.face(target);
            guard.update(dt);
            guard.man.upperArm.R.rotation.x =
              -1.6 + Math.sin(timeInState * 14) * 0.6;
            hitTime += dt;
            if (hitTime > 0.9) {
              // 攻撃を受けたプレイヤーはスタート地点へ戻される
              hitTime = 0;
              player.reset();
            }
            if (distance > 1.4) {
              enter("chase");
            }
            break;
          }
          case "search": {
            if (guard.position.distanceTo(lastSeen) > 0.3 && lookAround === 0) {
              guard.goTo(lastSeen);
              guard.update(dt, 1.4);
            } else {
              lookAround += dt;
              guard.stop();
              guard.root.rotation.y +=
                dt * 1.6 * Math.sign(Math.sin(lookAround * 1.2) + 0.01);
              guard.update(dt);
            }
            if (sees) {
              lookAround = 0;
              enter("chase");
            } else if (lookAround > 4) {
              lookAround = 0;
              lastSeenValid = false;
              enter("patrol");
            }
            break;
          }
          default: {
            break;
          }
        }
        guard.setConeColor(STATES[state].color);
        lastSeenMarker.visible =
          lastSeenValid && (state === "chase" || state === "search");
        lastSeenMarker.position.copy(lastSeen).setY(0.3);

        flashTime = Math.max(0, flashTime - dt);
        for (const node of stateNodes) {
          const active = node.key === state;
          node.circle.setAttribute(
            "fill",
            active ? STATES[node.key].color : "#101826"
          );
          node.text.setAttribute("fill", active ? "#0a0f17" : "#e8eef6");
        }
        for (const node of edgeNodes) {
          const lit = flash === node.edge && flashTime > 0;
          node.path.setAttribute(
            "stroke",
            lit ? STATES[node.edge.to].color : "#51607a"
          );
          node.path.setAttribute("stroke-width", lit ? "3" : "1.5");
          node.label.setAttribute("fill", lit ? "#e8eef6" : "#8f9eb3");
        }
        context.readout(
          "今の状態",
          `${STATES[state].name}（${timeInState.toFixed(1)} 秒）`
        );
        context.readout("プレイヤーが見えている", sees ? "はい" : "いいえ");
        context.caption(CAPTIONS[state]);
      },
      dispose() {
        view.dispose();
      },
    };
  },
};
