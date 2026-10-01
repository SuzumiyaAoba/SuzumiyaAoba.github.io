import { BoxGeometry, Mesh, Vector3 } from "three";
import {
  arenaMap,
  at,
  diagramPanel,
  npc,
  playerTarget,
  svg,
} from "../../arena";
import type { Npc } from "../../arena";
import { TAU, palette, segments, standard } from "../../kit";
import { gridView, walkable, cellAt } from "../../navgrid";
import type { DemoModule } from "../../types";

const FRESH = 8;
const GUARDS = [
  { name: "A", color: palette.coral },
  { name: "B", color: palette.amber },
  { name: "C", color: palette.pink },
  { name: "D", color: palette.violet },
] as const;

type Mode = "private" | "shared";

type Entry = { value: string; writer: string; time: number };

export const demo: DemoModule = {
  alt: "複数の見張りが、共有の黒板（ブラックボード）に情報を書き込み、読み合って連携するデモ。誰かがプレイヤー（緑の球）を見つけると、敵の位置・時刻・見つけた見張りを黒板に書く。ほかの見張りは黒板を読んで駆けつけ、担当の方向（北・東・南・西）も黒板で取り合うので、同じ所に集まらずに取り囲む。個別の記憶にすると、見つけた見張りしか反応しない。右下の表が黒板の中身で、黄色の線が書き込み、青い線が読み取り。",
  camera: { position: [0, 10.5, 7.5], target: [0, 0, 0.4], fov: 42 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "情報の持ち方",
      value: "shared",
      options: [
        { value: "private", label: "見張りごとの記憶だけ" },
        { value: "shared", label: "共有のブラックボード" },
      ],
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
    { color: palette.amber, label: "黒板への書き込み" },
    { color: palette.sky, label: "黒板からの読み取り" },
  ],
  hint: "緑の球をドラッグしてプレイヤーを動かせます",
  setup(context) {
    const { scene, params } = context;
    const map = arenaMap();
    const view = gridView(map, { wallHeight: 0.6 });
    scene.add(view);
    const board = new Mesh(
      new BoxGeometry(1.4, 0.8, 0.06),
      standard("#23402f", { roughness: 0.9 })
    );
    const boardPosition = new Vector3(0, 1.3, -4.4);
    board.position.copy(boardPosition);
    scene.add(board);
    const boardLabel = context.label("ブラックボード", { tone: "strong" });
    boardLabel.position.copy(boardPosition).setY(0.75);
    scene.add(boardLabel);
    const writeLines = segments([], palette.amber, {
      width: 2.5,
      dashed: true,
      dashSize: 0.15,
      gapSize: 0.1,
    });
    const readLines = segments([], palette.sky, {
      width: 1.6,
      dashed: true,
      dashSize: 0.1,
      gapSize: 0.12,
    });
    scene.add(writeLines, readLines);

    const routes = [
      [at(map, 2, 2), at(map, 9, 2), at(map, 9, 5), at(map, 2, 5)],
      [at(map, 13, 2), at(map, 25, 2), at(map, 25, 5), at(map, 13, 5)],
      [at(map, 2, 9), at(map, 14, 9), at(map, 14, 13), at(map, 2, 13)],
      [at(map, 19, 9), at(map, 26, 9), at(map, 26, 13), at(map, 19, 13)],
    ];
    const guards = GUARDS.map((spec, i) => {
      const agent: Npc = npc(context, map, { accent: spec.color, range: 4 });
      const route = routes[i] ?? [];
      agent.root.position.copy(route[0] ?? new Vector3());
      const tag = context.label(spec.name, { color: spec.color });
      scene.add(tag);
      return {
        ...spec,
        agent,
        route,
        waypoint: 0,
        tag,
        memory: null as Vector3 | null,
        memoryTime: -99,
        wait: 0,
      };
    });
    const player = playerTarget(context, map, [
      at(map, 20, 5),
      at(map, 20, 12),
      at(map, 4, 12),
      at(map, 4, 9),
      at(map, 15, 9),
      at(map, 15, 5),
    ]);

    const blackboard = new Map<string, Entry>();
    const { root } = diagramPanel(context, {
      title: "ブラックボードの中身",
      width: 330,
      height: 150,
      rem: 18,
    });
    const header = ["キー", "値", "書いた人", "経過"];
    const columnX = [8, 98, 222, 290];
    for (const [i, text] of header.entries()) {
      root.append(
        svg(
          "text",
          { x: columnX[i] ?? 0, y: 14, fill: "#8f9eb3", "font-size": 10 },
          text
        )
      );
    }
    const cells = Array.from({ length: 6 }, (_, row) =>
      columnX.map((x) => {
        const text = svg("text", {
          x,
          y: 36 + row * 20,
          fill: "#e8eef6",
          "font-size": 10.5,
        });
        root.append(text);
        return text;
      })
    );

    const slots = ["北", "東", "南", "西"];
    const target = new Vector3();
    const writes: Vector3[] = [];
    const reads: Vector3[] = [];

    const write = (
      key: string,
      value: string,
      writer: string,
      now: number,
      from: Vector3
    ) => {
      blackboard.set(key, { value, writer, time: now });
      writes.push(from.clone().setY(1), boardPosition.clone());
    };

    return {
      update({ dt, time }) {
        player.update(dt, params["auto"] === true);
        target.copy(player.position).setY(0);
        const mode: Mode = params["mode"] === "private" ? "private" : "shared";
        writes.length = 0;
        reads.length = 0;
        let anyone = 0;

        for (const guard of guards) {
          const { agent } = guard;
          const sees = agent.sees(target);
          if (sees) {
            anyone++;
            guard.memory = target.clone();
            guard.memoryTime = time;
            if (mode === "shared") {
              write(
                "敵の位置",
                `(${target.x.toFixed(1)}, ${target.z.toFixed(1)})`,
                guard.name,
                time,
                agent.position
              );
              write(
                "見つけた人",
                `見張り ${guard.name}`,
                guard.name,
                time,
                agent.position
              );
            }
          }
        }
        const alarm = blackboard.get("敵の位置");
        const alarmAge = alarm ? time - alarm.time : 99;
        const lastKnown = guards
          .filter((g) => g.memory !== null)
          .toSorted((a, b) => b.memoryTime - a.memoryTime)[0]?.memory;
        if (mode === "shared") {
          blackboard.set("警戒レベル", {
            value: anyone > 0 ? "戦闘" : alarmAge < FRESH ? "警戒" : "平常",
            writer: anyone > 0 ? "見張り" : "—",
            time:
              anyone > 0 ? time : (blackboard.get("警戒レベル")?.time ?? time),
          });
        }

        // 駆けつける見張りが、担当の方向を黒板で取り合う
        const responders = guards.filter(
          (g) => mode === "shared" && alarmAge < FRESH && !g.agent.sees(target)
        );
        // 担当の割り当てが変わった古い書き込みは消す
        const assigned = new Map(
          responders.map((guard, i) => [
            `担当 ${slots[i % slots.length] ?? "北"}`,
            guard.name,
          ])
        );
        for (const [key, entry] of blackboard) {
          if (key.startsWith("担当") && assigned.get(key) !== entry.writer) {
            blackboard.delete(key);
          }
        }
        for (const guard of guards) {
          const { agent } = guard;
          const sees = agent.sees(target);
          const slot = responders.indexOf(guard);
          if (sees) {
            agent.goTo(target);
            agent.update(dt, 1.9);
            agent.setIcon("!");
          } else if (slot !== -1 && lastKnown) {
            const name = slots[slot % slots.length] ?? "北";
            if (
              !blackboard.has(`担当 ${name}`) ||
              blackboard.get(`担当 ${name}`)?.writer !== guard.name
            ) {
              write(
                `担当 ${name}`,
                `見張り ${guard.name}`,
                guard.name,
                time,
                agent.position
              );
            }
            reads.push(boardPosition.clone(), agent.position.clone().setY(1));
            const angle =
              (slot / Math.max(1, responders.length)) * TAU + Math.PI / 2;
            const spot = lastKnown
              .clone()
              .add(
                new Vector3(
                  Math.cos(angle),
                  0,
                  -Math.sin(angle)
                ).multiplyScalar(1.3)
              );
            const goal = walkable(map, cellAt(map, spot.x, spot.z))
              ? spot
              : lastKnown;
            agent.goTo(goal);
            agent.update(dt, 1.7);
            agent.setIcon("?");
          } else if (
            mode === "private" &&
            guard.memory &&
            time - guard.memoryTime < 4
          ) {
            agent.goTo(guard.memory);
            agent.update(dt, 1.5);
            agent.setIcon("?");
          } else {
            const current = guard.route[guard.waypoint];
            if (current && agent.position.distanceTo(current) < 0.2) {
              guard.waypoint = (guard.waypoint + 1) % guard.route.length;
            }
            const goal = guard.route[guard.waypoint];
            if (goal) {
              agent.goTo(goal);
            }
            agent.update(dt, 1);
            agent.setIcon("");
          }
          guard.tag.position.copy(agent.position).setY(1.6);
        }
        if (mode === "shared" && alarmAge >= FRESH) {
          for (const key of blackboard.keys()) {
            if (key.startsWith("担当")) {
              blackboard.delete(key);
            }
          }
        }
        if (mode === "private") {
          blackboard.clear();
        }

        writeLines.setPoints(writes);
        writeLines.visible = writes.length > 0;
        readLines.setPoints(reads);
        readLines.visible = reads.length > 0;
        board.visible = mode === "shared";
        boardLabel.visible = mode === "shared";

        const entries = [...blackboard.entries()].slice(0, cells.length);
        for (const [row, line] of cells.entries()) {
          const entry = entries[row];
          const values = entry
            ? [
                entry[0],
                entry[1].value,
                entry[1].writer,
                `${(time - entry[1].time).toFixed(1)} 秒`,
              ]
            : ["", "", "", ""];
          for (const [col, text] of line.entries()) {
            text.textContent = values[col] ?? "";
          }
        }
        const reacting = guards.filter(
          (g) => g.agent.sees(target) || responders.includes(g)
        ).length;
        context.readout("見つけている見張り", `${anyone}`);
        context.readout(
          "反応している見張り",
          `${mode === "shared" ? reacting : anyone}`
        );
        context.caption(
          mode === "shared"
            ? "見つけた見張りが「敵の位置」を黒板に書くと（黄色の線）、ほかの見張りがそれを読んで（青い線）駆けつける。担当の方向も黒板で取り合うので、みんなが同じ所へ殺到せず、取り囲むように動く。見張りどうしは互いを直接知らなくてよい。"
            : "見張りごとの記憶だけでは、自分で見たことしか知らないので、プレイヤーを見つけた見張りだけが追いかけ、ほかの見張りは巡回を続ける。"
        );
      },
      dispose() {
        view.dispose();
      },
    };
  },
};
