import { Mesh, MeshBasicMaterial, RingGeometry, Vector3 } from "three";
import {
  arenaMap,
  at,
  diagramPanel,
  npc,
  playerTarget,
  randomWalkable,
  svg,
} from "../../arena";
import { marker, palette, rng } from "../../kit";
import { cellAt, gridView, walkable } from "../../navgrid";
import type { DemoModule } from "../../types";

type Status = "success" | "failure" | "running";
type Kind = "selector" | "sequence" | "condition" | "action";
type BtNode = {
  id: string;
  label: string;
  kind: Kind;
  children?: BtNode[];
  run?: (dt: number) => Status;
  reset?: () => void;
  x: number;
  y: number;
};

const STATUS_COLOR: Record<Status, string> = {
  success: palette.lime,
  failure: palette.coral,
  running: palette.amber,
};

const condition = (id: string, label: string, test: () => boolean): BtNode => ({
  id,
  label,
  kind: "condition",
  run: () => (test() ? "success" : "failure"),
  x: 0,
  y: 0,
});
const action = (
  id: string,
  label: string,
  run: (dt: number) => Status,
  reset?: () => void
): BtNode => ({
  id,
  label,
  kind: "action",
  run,
  ...(reset ? { reset } : {}),
  x: 0,
  y: 0,
});
const sequence = (id: string, label: string, children: BtNode[]): BtNode => ({
  id,
  label,
  kind: "sequence",
  children,
  x: 0,
  y: 0,
});

export const demo: DemoModule = {
  alt: "見張りの敵の判断を、ビヘイビアツリー（行動木）で作るデモ。根のセレクターは、左の枝から順に試し、最初に失敗しなかった枝を実行する。各枝のシーケンスは、条件（緑の球が見える、近い、物音を聞いた、体力が少ない）を確かめてから、行動（走る、攻撃する、音の所へ行って見回す、回復地点で休む）を順に実行する。右下の木で、毎フレームどの節を通り、成功（緑）・失敗（赤）・実行中（黄）になったかがわかる。床をクリックすると物音を立てられる。",
  camera: { position: [0, 10.5, 7.5], target: [0, 0, 0.4], fov: 42 },
  controls: [
    {
      type: "toggle",
      key: "auto",
      label: "プレイヤーを自動で動かす",
      value: true,
    },
    {
      type: "toggle",
      key: "noise",
      label: "ときどき物音を立てる",
      value: true,
    },
    { type: "button", key: "hurt", label: "見張りに傷を負わせる" },
  ],
  legend: [
    { color: palette.lime, label: "成功した節 / プレイヤー" },
    { color: palette.amber, label: "実行中の節" },
    { color: palette.coral, label: "失敗した節 / 見張り" },
    { color: palette.sky, label: "物音 / 回復地点" },
  ],
  hint: "床をクリックすると物音を立てます。緑の球はドラッグで動かせます",
  setup(context) {
    const { scene, params } = context;
    const map = arenaMap();
    const view = gridView(map, { wallHeight: 0.6 });
    scene.add(view);
    const guard = npc(context, map, { accent: palette.coral });
    const patrol = [at(map, 3, 2), at(map, 9, 2), at(map, 9, 5), at(map, 2, 5)];
    guard.root.position.copy(patrol[0] ?? guard.root.position);
    const player = playerTarget(context, map, [
      at(map, 20, 5),
      at(map, 20, 12),
      at(map, 4, 12),
      at(map, 4, 9),
      at(map, 15, 9),
      at(map, 15, 5),
    ]);
    const healSpot = at(map, 25, 2);
    const healMarker = marker(palette.sky, 0.14);
    healMarker.position.copy(healSpot).setY(0.15);
    scene.add(healMarker);
    const healLabel = context.label("回復地点", { color: palette.sky });
    healLabel.position.copy(healSpot).setY(0.6);
    scene.add(healLabel);
    const ring = new Mesh(
      new RingGeometry(0.9, 1, 48),
      new MeshBasicMaterial({ color: palette.sky, transparent: true })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    scene.add(ring);
    const hpLabel = context.label("", { tone: "strong" });
    scene.add(hpLabel);

    const random = rng(5);
    let hp = 100;
    let recovering = false;
    let heard: Vector3 | null = null;
    let noiseAge = 99;
    let lookTime = 0;
    let waypoint = 0;
    let noiseTimer = 6;
    const target = new Vector3();
    let sees = false;

    const makeNoise = (point: Vector3) => {
      ring.position.set(point.x, 0.05, point.z);
      noiseAge = 0;
      if (guard.position.distanceTo(point) < 9) {
        heard = point.clone().setY(0);
        lookTime = 0;
      }
    };
    context.onPick((point) => {
      if (walkable(map, cellAt(map, point.x, point.z))) {
        makeNoise(point);
      }
    });

    const tree: BtNode = {
      id: "root",
      label: "セレクター",
      kind: "selector",
      x: 0,
      y: 0,
      children: [
        sequence("heal", "補給", [
          condition("low", "体力が少ない?", () => {
            if (hp < 30) {
              recovering = true;
            }
            return recovering;
          }),
          action("toHeal", "回復地点へ", (dt) => {
            guard.goTo(healSpot);
            guard.update(dt, 1.6);
            return guard.position.distanceTo(healSpot) < 0.3
              ? "success"
              : "running";
          }),
          action("rest", "休む", (dt) => {
            guard.stop();
            guard.update(dt);
            hp = Math.min(100, hp + dt * 30);
            if (hp >= 100) {
              recovering = false;
              return "success";
            }
            return "running";
          }),
        ]),
        sequence("attack", "攻撃", [
          condition(
            "near",
            "敵が近い?",
            () => guard.position.distanceTo(target) < 1
          ),
          action("hit", "攻撃する", (dt) => {
            guard.stop();
            guard.face(target);
            guard.update(dt);
            guard.man.upperArm.R.rotation.x =
              -1.6 + Math.sin(performance.now() / 70) * 0.6;
            // プレイヤーも反撃してくるので、体力が減る
            hp -= dt * 14;
            return "running";
          }),
        ]),
        sequence("chase", "追跡", [
          condition("see", "敵が見える?", () => sees),
          action("run", "敵へ走る", (dt) => {
            guard.goTo(target);
            guard.update(dt, 2);
            return "running";
          }),
        ]),
        sequence("investigate", "調べる", [
          condition("heard", "物音を聞いた?", () => heard !== null),
          action("toNoise", "音の所へ", (dt) => {
            if (!heard) {
              return "failure";
            }
            guard.goTo(heard);
            guard.update(dt, 1.5);
            return guard.position.distanceTo(heard) < 0.35
              ? "success"
              : "running";
          }),
          action(
            "look",
            "見回す",
            (dt) => {
              guard.stop();
              lookTime += dt;
              guard.root.rotation.y +=
                dt * 2 * Math.sign(Math.sin(lookTime * 1.5) + 0.01);
              guard.update(dt);
              if (lookTime > 2.6) {
                heard = null;
                lookTime = 0;
                return "success";
              }
              return "running";
            },
            () => {
              lookTime = 0;
            }
          ),
        ]),
        action("patrol", "巡回", (dt) => {
          const current = patrol[waypoint];
          if (current && guard.position.distanceTo(current) < 0.2) {
            waypoint = (waypoint + 1) % patrol.length;
          }
          const goal = patrol[waypoint];
          if (goal) {
            guard.goTo(goal);
          }
          guard.update(dt, 1.1);
          return "running";
        }),
      ],
    };

    // 木の配置
    const columns = tree.children ?? [];
    tree.x = 170;
    tree.y = 16;
    for (const [i, child] of columns.entries()) {
      child.x = 36 + i * 67;
      child.y = 58;
      for (const [k, leaf] of (child.children ?? []).entries()) {
        leaf.x = child.x;
        leaf.y = 98 + k * 34;
      }
    }
    const { root } = diagramPanel(context, {
      title: "ビヘイビアツリー（毎フレーム左から評価）",
      width: 340,
      height: 190,
      rem: 19,
    });
    const shapes = new Map<
      string,
      { box: SVGRectElement; text: SVGTextElement }
    >();
    const all: BtNode[] = [];
    const walk = (node: BtNode) => {
      all.push(node);
      for (const child of node.children ?? []) {
        root.append(
          svg("line", {
            x1: node.x,
            y1: node.y,
            x2: child.x,
            y2: child.y,
            stroke: "#51607a",
            "stroke-width": 1.2,
          })
        );
        walk(child);
      }
    };
    walk(tree);
    for (const node of all) {
      const width = node.kind === "selector" ? 70 : 62;
      const box = svg("rect", {
        x: node.x - width / 2,
        y: node.y - 12,
        width,
        height: 24,
        rx: node.kind === "condition" ? 12 : 4,
        fill: "#101826",
        stroke: "#51607a",
        "stroke-width": 1.4,
      });
      const prefix =
        node.kind === "selector" ? "? " : node.kind === "sequence" ? "→ " : "";
      const text = svg(
        "text",
        {
          x: node.x,
          y: node.y + 3.5,
          "text-anchor": "middle",
          fill: "#e8eef6",
          "font-size": 9,
          "font-weight":
            node.kind === "action" || node.kind === "condition" ? 500 : 700,
        },
        `${prefix}${node.label}`
      );
      root.append(box, text);
      shapes.set(node.id, { box, text });
    }

    const statuses = new Map<string, Status>();
    let running = new Set<string>();
    const tick = (node: BtNode, dt: number): Status => {
      let status: Status;
      if (node.kind === "selector") {
        status = "failure";
        for (const child of node.children ?? []) {
          const result = tick(child, dt);
          if (result !== "failure") {
            status = result;
            break;
          }
        }
      } else if (node.kind === "sequence") {
        status = "success";
        for (const child of node.children ?? []) {
          const result = tick(child, dt);
          if (result !== "success") {
            status = result;
            break;
          }
        }
      } else {
        status = node.run?.(dt) ?? "failure";
      }
      statuses.set(node.id, status);
      return status;
    };

    return {
      update({ dt }) {
        player.update(dt, params["auto"] === true);
        target.copy(player.position).setY(0);
        sees = guard.sees(target);
        if (params["noise"] === true) {
          noiseTimer -= dt;
          if (noiseTimer <= 0) {
            noiseTimer = 10 + random() * 6;
            makeNoise(randomWalkable(map, random));
          }
        }
        noiseAge += dt;
        ring.visible = noiseAge < 1.2;
        ring.scale.setScalar(0.3 + noiseAge * 3);
        ring.material.opacity = Math.max(0, 1 - noiseAge / 1.2);

        statuses.clear();
        tick(tree, dt);
        // 今回実行されなかった「実行中だった行動」は中断されたので、状態を戻す
        const now = new Set(
          [...statuses].filter(([, s]) => s === "running").map(([id]) => id)
        );
        for (const id of running) {
          if (!now.has(id)) {
            all.find((node) => node.id === id)?.reset?.();
          }
        }
        running = now;

        for (const node of all) {
          const shape = shapes.get(node.id);
          if (!shape) {
            continue;
          }
          const status = statuses.get(node.id);
          const color = status ? STATUS_COLOR[status] : "#51607a";
          shape.box.setAttribute("stroke", color);
          shape.box.setAttribute(
            "fill",
            status === "running"
              ? "#3a3016"
              : status === "success"
                ? "#1f3318"
                : "#101826"
          );
          shape.text.setAttribute("fill", status ? "#e8eef6" : "#6f7d92");
        }
        const branch = columns.find(
          (child) => statuses.get(child.id) === "running"
        );
        guard.setIcon(
          branch?.id === "chase" || branch?.id === "attack"
            ? "!"
            : branch?.id === "investigate"
              ? "?"
              : branch?.id === "heal"
                ? "+"
                : ""
        );
        hpLabel.setText(`体力 ${Math.max(0, hp).toFixed(0)}`);
        hpLabel.position.copy(guard.position).setY(1.7);
        context.readout("実行中の枝", branch?.label ?? "—");
        context.readout("体力", Math.max(0, hp).toFixed(0));
        context.caption(
          branch?.id === "heal"
            ? "補給：体力が 30 を切ると、ほかの何よりも優先して回復地点へ向かう。いちばん左の枝ほど優先度が高い。回復中に「体力が少ない?」が失敗しないよう、満タンになるまで回復を続ける印を覚えておく。"
            : branch?.id === "attack"
              ? "攻撃：「敵が近い?」が成功したので、その右の「攻撃する」を実行している。反撃で体力が減っていく。"
              : branch?.id === "chase"
                ? "追跡：上の枝（補給・攻撃）の条件が失敗したので、「敵が見える?」を試して成功し、「敵へ走る」を実行中。毎フレーム根から評価し直すので、近づけばすぐ「攻撃」の枝に切り替わる。"
                : branch?.id === "investigate"
                  ? "調べる：物音を聞いたので、音の所へ行って見回す。途中でプレイヤーが見えると、優先度の高い「追跡」の枝に割り込まれ、見回しは中断される。"
                  : "巡回：上の枝の条件がすべて失敗したので、最後の「巡回」を実行している。床をクリックして物音を立てると、「調べる」の枝が動き出す。"
        );
      },
      action(key) {
        if (key === "hurt") {
          hp = 20;
        }
      },
      dispose() {
        view.dispose();
      },
    };
  },
};
