import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  PointLight,
  Vector3,
} from "three";
import { arenaMap, at, diagramPanel, npc, svg } from "../../arena";
import { marker, palette, standard } from "../../kit";
import { MinHeap, gridView } from "../../navgrid";
import type { DemoModule } from "../../types";

const HAS_AXE = 1;
const AXE_ON_RACK = 2;
const HAS_WOOD = 4;
const FIRE = 8;
const HAS_MONEY = 16;
const GOAL = FIRE;

type Place = "rack" | "forest" | "branches" | "shop" | "camp";
type Action = {
  key: string;
  name: string;
  place: Place;
  cost: number;
  /** 前提：これらのビットが立っていること。 */
  need: number;
  /** 前提：これらのビットが立っていないこと。 */
  without: number;
  add: number;
  remove: number;
};

const ACTIONS: readonly Action[] = [
  {
    key: "pick",
    name: "斧を拾う",
    place: "rack",
    cost: 1,
    need: AXE_ON_RACK,
    without: HAS_AXE,
    add: HAS_AXE,
    remove: AXE_ON_RACK,
  },
  {
    key: "chop",
    name: "木を切る",
    place: "forest",
    cost: 2,
    need: HAS_AXE,
    without: HAS_WOOD,
    add: HAS_WOOD,
    remove: 0,
  },
  {
    key: "gather",
    name: "枝を集める",
    place: "branches",
    cost: 12,
    need: 0,
    without: HAS_WOOD,
    add: HAS_WOOD,
    remove: 0,
  },
  {
    key: "buy",
    name: "薪を買う",
    place: "shop",
    cost: 2,
    need: HAS_MONEY,
    without: HAS_WOOD,
    add: HAS_WOOD,
    remove: HAS_MONEY,
  },
  {
    key: "light",
    name: "火を起こす",
    place: "camp",
    cost: 1,
    need: HAS_WOOD,
    without: FIRE,
    add: FIRE,
    remove: HAS_WOOD,
  },
];

const usable = (action: Action, facts: number) =>
  (facts & action.need) === action.need && (facts & action.without) === 0;
/** a に b のビットを立てる。 */
const withBits = (a: number, b: number) => a ^ (b & ~a);
const apply = (action: Action, facts: number) =>
  withBits(facts, action.add) & ~action.remove;
const unsatisfied = (facts: number) => ((facts & GOAL) === GOAL ? 0 : 1);

type Plan = { actions: Action[]; cost: number };

/**
 * 前向きの A*：状態（事実のビットと、いる場所）から、使える行動を試して目標の状態を探す。
 * コスト = 行動の手間 + 移動距離 × moveWeight。見積もり h = 満たしていない目標の数。
 */
function planFor(
  facts: number,
  start: Vector3,
  places: Record<Place, Vector3>,
  moveWeight: number
) {
  type Node = { facts: number; at: Vector3; g: number; plan: Action[] };
  const nodes: Node[] = [{ facts, at: start, g: 0, plan: [] }];
  const heap = new MinHeap();
  heap.push(0, unsatisfied(facts));
  const best = new Map<string, number>();
  let expanded = 0;
  while (heap.size > 0) {
    const index = heap.pop();
    const node = index === undefined ? undefined : nodes[index];
    if (!node) {
      continue;
    }
    expanded++;
    if (unsatisfied(node.facts) === 0) {
      return { plan: { actions: node.plan, cost: node.g }, expanded };
    }
    for (const action of ACTIONS) {
      if (!usable(action, node.facts)) {
        continue;
      }
      const place = places[action.place];
      const g = node.g + action.cost + node.at.distanceTo(place) * moveWeight;
      const nextFacts = apply(action, node.facts);
      const key = `${nextFacts}|${action.place}`;
      if (g >= (best.get(key) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }
      best.set(key, g);
      nodes.push({
        facts: nextFacts,
        at: place,
        g,
        plan: [...node.plan, action],
      });
      heap.push(nodes.length - 1, g + unsatisfied(nextFacts));
    }
  }
  return { plan: null, expanded };
}

/** 比較用：目標に届く手順を全部数え上げ、コストの安い順に並べる。 */
function allPlans(
  facts: number,
  start: Vector3,
  places: Record<Place, Vector3>,
  moveWeight: number
) {
  const plans: Plan[] = [];
  const visit = (
    current: number,
    from: Vector3,
    cost: number,
    list: Action[]
  ) => {
    if (unsatisfied(current) === 0) {
      plans.push({ actions: list, cost });
      return;
    }
    if (list.length >= 4) {
      return;
    }
    for (const action of ACTIONS) {
      if (usable(action, current)) {
        const place = places[action.place];
        visit(
          apply(action, current),
          place,
          cost + action.cost + from.distanceTo(place) * moveWeight,
          [...list, action]
        );
      }
    }
  };
  visit(facts, start, 0, []);
  // 1 つ抜いても目標に届く手順（むだな行動を含む）は候補から外す
  const reaches = (list: readonly Action[]) => {
    let current = facts;
    for (const action of list) {
      if (!usable(action, current)) {
        return false;
      }
      current = apply(action, current);
    }
    return unsatisfied(current) === 0;
  };
  return plans
    .filter(
      (candidate) =>
        !candidate.actions.some((_, i) =>
          reaches(candidate.actions.filter((__, k) => k !== i))
        )
    )
    .toSorted((a, b) => a.cost - b.cost);
}

export const demo: DemoModule = {
  alt: "目標から逆算して行動の手順を組み立てる GOAP（目標指向の行動計画）のデモ。村人の目標は「火がある」。行動には、前提（斧を持っている、薪を持っている、お金がある）と効果があり、手間（コスト）と移動距離の合計が最も小さくなる手順を A* で探す。斧が置き場にあれば「斧を拾う → 木を切る → 火を起こす」、お金があれば「薪を買う → 火を起こす」、どちらもなければ時間のかかる「枝を集める」を選ぶ。途中で世界の状態が変わると、計画を立て直す。",
  camera: { position: [0, 10.5, 7.5], target: [0, 0, 0.4], fov: 42 },
  controls: [
    {
      type: "toggle",
      key: "axe",
      label: "斧が置き場にある",
      value: true,
    },
    {
      type: "toggle",
      key: "money",
      label: "お金を持っている",
      value: false,
    },
    {
      type: "range",
      key: "move",
      label: "移動距離の重み（1 m あたりのコスト）",
      min: 0,
      max: 1.5,
      step: 0.05,
      value: 0.5,
    },
  ],
  legend: [
    { color: palette.amber, label: "実行中の行動" },
    { color: palette.lime, label: "選ばれた計画" },
    { color: palette.muted, label: "ほかの候補（コストが高い）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const map = arenaMap();
    const view = gridView(map, { wallHeight: 0.6 });
    scene.add(view);
    const places: Record<Place, Vector3> = {
      rack: at(map, 3, 2),
      forest: at(map, 24, 3),
      branches: at(map, 5, 13),
      shop: at(map, 24, 12),
      camp: at(map, 13, 10),
    };
    const names: Record<Place, string> = {
      rack: "斧置き場",
      forest: "森",
      branches: "枝の落ちている所",
      shop: "薪の店",
      camp: "焚き火",
    };
    for (const key of Object.keys(names).filter(
      (k): k is Place => k in places
    )) {
      const position = places[key];
      const label = context.label(names[key], {
        tone: "muted",
      });
      label.position.copy(position).setY(0.9);
      scene.add(label);
    }
    const wood = standard("#8a6240", { roughness: 0.8 });
    const leaves = standard("#2f6b3e", { roughness: 0.8 });
    for (const [dx, dz] of [
      [0, 0],
      [0.6, 0.4],
      [-0.5, 0.5],
      [0.4, -0.5],
      [-0.4, -0.4],
    ] as const) {
      const tree = new Group();
      const trunk = new Mesh(new CylinderGeometry(0.06, 0.08, 0.4), wood);
      trunk.position.y = 0.2;
      const crown = new Mesh(new ConeGeometry(0.28, 0.8, 10), leaves);
      crown.position.y = 0.75;
      crown.castShadow = true;
      tree.add(trunk, crown);
      tree.position.copy(places.forest).add(new Vector3(dx, 0, dz - 0.9));
      scene.add(tree);
    }
    for (let k = 0; k < 6; k++) {
      const stick = new Mesh(new CylinderGeometry(0.02, 0.02, 0.5), wood);
      stick.rotation.z = Math.PI / 2;
      stick.rotation.y = k * 1.1;
      stick.position
        .copy(places.branches)
        .add(new Vector3(Math.cos(k * 2) * 0.5, 0.03, Math.sin(k * 2) * 0.5));
      scene.add(stick);
    }
    const shop = new Mesh(new BoxGeometry(0.9, 0.5, 0.5), standard("#7a5a3a"));
    shop.position.copy(places.shop).add(new Vector3(0, 0.25, -0.5));
    scene.add(shop);
    const rack = new Mesh(new BoxGeometry(0.6, 0.35, 0.2), wood);
    rack.position.copy(places.rack).add(new Vector3(0, 0.17, -0.45));
    scene.add(rack);
    const axe = new Group();
    const handleMesh = new Mesh(new CylinderGeometry(0.02, 0.02, 0.5), wood);
    const head = new Mesh(
      new BoxGeometry(0.14, 0.1, 0.03),
      standard("#cfd6e2", { metalness: 0.7 })
    );
    head.position.set(0.06, 0.22, 0);
    axe.add(handleMesh, head);
    scene.add(axe);
    const bundle = new Mesh(new CylinderGeometry(0.1, 0.1, 0.35, 8), wood);
    bundle.rotation.z = Math.PI / 2;
    scene.add(bundle);
    const logs = new Mesh(new CylinderGeometry(0.25, 0.3, 0.12, 8), wood);
    logs.position.copy(places.camp).setY(0.06);
    scene.add(logs);
    const flame = marker(palette.amber, 0.22);
    flame.position.copy(places.camp).setY(0.35);
    const light = new PointLight(palette.amber, 0, 5);
    light.position.copy(places.camp).setY(0.8);
    scene.add(flame, light);

    const villager = npc(context, map, {
      accent: palette.amber,
      fov: 0.01,
      range: 0.01,
    });
    villager.cone.visible = false;
    villager.root.position.copy(places.camp).add(new Vector3(1, 0, 1));

    const { root } = diagramPanel(context, {
      title: "目標「火がある」への計画（A*）",
      width: 330,
      height: 150,
      rem: 18,
    });
    const rows = Array.from({ length: 6 }, (_, i) => {
      const text = svg("text", {
        x: 8,
        y: 18 + i * 23,
        fill: "#e8eef6",
        "font-size": 11,
      });
      root.append(text);
      return text;
    });

    let facts = withBits(HAS_MONEY, AXE_ON_RACK);
    let plan: Action[] = [];
    let alternatives: Plan[] = [];
    let expanded = 0;
    let step = 0;
    let working = 0;
    let burning = 0;
    let signature = "";

    const worldFacts = () => {
      let next = facts & ~withBits(AXE_ON_RACK, HAS_MONEY);
      if (params["axe"] === true && (facts & HAS_AXE) === 0) {
        next = withBits(next, AXE_ON_RACK);
      }
      if (params["money"] === true) {
        next = withBits(next, HAS_MONEY);
      }
      return next;
    };
    const replan = () => {
      facts = worldFacts();
      const weight = Number(params["move"]);
      const found = planFor(facts, villager.position, places, weight);
      plan = found.plan?.actions ?? [];
      ({ expanded } = found);
      alternatives = allPlans(facts, villager.position, places, weight);
      step = 0;
      working = 0;
      villager.stop();
      const chosen = plan.map((a) => a.name).join(" → ");
      const lines = [
        `選んだ計画：${chosen || "なし"}`,
        `調べた状態の数：${expanded}`,
        "候補（コストの安い順）：",
        ...alternatives
          .slice(0, 3)
          .map(
            (candidate) =>
              `${candidate.actions.map((a) => a.name).join(" → ")}　${candidate.cost.toFixed(1)}`
          ),
      ];
      for (const [i, row] of rows.entries()) {
        row.textContent = lines[i] ?? "";
        row.setAttribute(
          "fill",
          i === 0
            ? palette.lime
            : i >= 3
              ? i === 3
                ? "#e8eef6"
                : "#8f9eb3"
              : "#8f9eb3"
        );
      }
    };

    return {
      update({ dt, time }) {
        const next = `${String(params["axe"])}|${String(params["money"])}|${String(params["move"])}`;
        if (next !== signature) {
          signature = next;
          replan();
        }
        const fireLit = (facts & FIRE) !== 0;
        if (fireLit) {
          burning += dt;
          villager.update(dt);
          if (burning > 4) {
            // 火が消えたら、目標がまた満たされなくなるので計画し直す
            burning = 0;
            facts &= ~FIRE;
            replan();
          }
        } else {
          const action = plan[step];
          if (action) {
            if (
              !usable(
                action,
                withBits(worldFacts(), facts & withBits(HAS_AXE, HAS_WOOD))
              )
            ) {
              // 前提が崩れた（斧がなくなった、お金を失った）ので計画し直す
              replan();
            } else if (
              villager.position.distanceTo(places[action.place]) > 0.35
            ) {
              villager.goTo(places[action.place]);
              villager.update(dt, 1.8);
              villager.setIcon("");
            } else {
              villager.stop();
              villager.update(dt);
              villager.setIcon(action.name);
              working += dt;
              if (action.key === "chop" || action.key === "gather") {
                villager.man.upperArm.R.rotation.x =
                  -1.2 + Math.sin(time * 12) * 0.7;
              }
              if (working > (action.key === "gather" ? 3 : 1.2)) {
                working = 0;
                facts = apply(action, facts);
                step++;
                villager.setIcon("");
              }
            }
          } else if (plan.length === 0) {
            villager.update(dt);
          }
        }
        // 見た目：斧・薪・火
        const holding = (facts & HAS_AXE) !== 0;
        if (holding) {
          villager.man.hand.R.getWorldPosition(axe.position);
          axe.rotation.set(0, villager.root.rotation.y, 0.4);
        } else {
          axe.position.copy(places.rack).add(new Vector3(0, 0.45, -0.45));
          axe.rotation.set(0, 0, 0);
        }
        axe.visible = holding || params["axe"] === true;
        bundle.visible = (facts & HAS_WOOD) !== 0;
        villager.man.chest.getWorldPosition(bundle.position);
        const lit = (facts & FIRE) !== 0;
        flame.visible = lit;
        flame.scale.setScalar(1 + Math.sin(time * 17) * 0.12);
        light.intensity = lit ? 6 + Math.sin(time * 23) * 1.5 : 0;
        const action = plan[step];
        context.readout(
          "今の行動",
          lit ? "火に当たる" : action ? action.name : "—"
        );
        context.readout(
          "持ち物",
          [
            (facts & HAS_AXE) === 0 ? "" : "斧",
            (facts & HAS_WOOD) === 0 ? "" : "薪",
            (facts & HAS_MONEY) === 0 ? "" : "お金",
          ]
            .filter(Boolean)
            .join("・") || "なし"
        );
        context.caption(
          lit
            ? "目標「火がある」を達成した。しばらくすると火が消え、目標がまた満たされなくなるので、今いる場所から新しく計画を立てる。"
            : "行動ごとに「前提」と「効果」を書いておくだけで、手順は A* が組み立てる。斧やお金の有無を切り替えると、別の手順が選ばれる。実行中に前提が崩れたら（斧を取り上げるなど）、その場で計画し直す。"
        );
      },
      dispose() {
        view.dispose();
      },
    };
  },
};
