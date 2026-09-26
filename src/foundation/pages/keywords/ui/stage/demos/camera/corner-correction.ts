import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector2,
  Vector3,
} from "three";
import { palette, polyline } from "../../kit";
import { courseView, PLAYER, Player, playerView } from "../../platformer";
import type { Block } from "../../platformer";
import type { DemoModule } from "../../types";

// 床と、頭の少し上に浮いた足場。足場の左下の角に、頭がわずかに引っかかる位置から跳ぶ
const LEDGE_X = 0.8;
const BLOCKS: readonly Block[] = [
  { x: -4, y: -3, w: 9, h: 3 },
  { x: LEDGE_X, y: 1.25, w: 3.2, h: 0.6 },
];
const LANE_GAP = 11;
const CYCLE = 1.8;
/** 着地を待ってからジャンプを押す時刻。 */
const JUMP_AT = 0.15;
/** 右へ走り出す時刻。 */
const RUN_AT = JUMP_AT + 0.22;

export const demo: DemoModule = {
  alt: "ジャンプした頭が天井の角にほんの少しだけぶつかったとき、横にずらして通してあげるコーナー補正のデモ。左の列は補正なしで、角にわずかに触れただけで頭を打って落ちてしまう。右の列は補正ありで、はみ出しが小さければ体を横に押し出して、そのまま上の足場に乗れる。見た目ではほとんど重なっていないのにぶつかるのは、遊ぶ人にとって理不尽に感じる。",
  camera: { position: [0, 1.5, 17], target: [0, 1, 0], orbit: false },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "range",
      key: "overlap",
      label: "頭と角の重なり",
      min: 0.02,
      max: 0.5,
      step: 0.01,
      value: 0.14,
      format: (value) => `${Math.round(value * 100)} cm`,
    },
    {
      type: "range",
      key: "corner",
      label: "補正する最大の幅（右の列）",
      min: 0,
      max: 0.4,
      step: 0.01,
      value: 0.25,
      format: (value) => `${Math.round(value * 100)} cm`,
    },
  ],
  legend: [
    { color: palette.coral, label: "頭と角が重なっている部分" },
    { color: palette.amber, label: "頭の通った道すじ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const lanes = [
      { name: "補正なし", corrected: false, x: -LANE_GAP / 2 },
      { name: "補正あり", corrected: true, x: LANE_GAP / 2 },
    ].map((lane) => {
      const group = new Group();
      group.position.x = lane.x - 0.5;
      scene.add(group);
      courseView(BLOCKS, group);
      const avatar = playerView(lane.corrected ? palette.lime : palette.amber);
      group.add(avatar);
      const path = polyline([], palette.amber, { width: 2, opacity: 0.7 });
      group.add(path);
      const sliver = new Mesh(
        new BoxGeometry(1, 0.08, 0.9),
        new MeshBasicMaterial({ color: palette.coral })
      );
      sliver.position.set(LEDGE_X, BLOCKS[1]?.y ?? 0, 0.02);
      group.add(sliver);
      const label = context.label(lane.name, { tone: "strong" });
      label.position.set(lane.x, 4.2, 0);
      scene.add(label);
      const result = context.label("", { size: "sm" });
      result.position.set(lane.x, -3.6, 0);
      scene.add(result);
      return {
        ...lane,
        avatar,
        path,
        sliver,
        result,
        player: null as Player | null,
        points: [] as Vector3[],
        corners: 0,
      };
    });

    let clock = CYCLE;
    return {
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        const h = Math.min(dt, 1 / 60);
        const overlap = Number(params["overlap"]);
        const corner = Number(params["corner"]);
        clock += h;
        const restart = clock >= CYCLE;
        if (restart) {
          clock = 0;
        }
        for (const lane of lanes) {
          if (restart || lane.player === null) {
            // 体の右端が、足場の左端より overlap だけ内側に入る位置
            lane.player = new Player(
              BLOCKS,
              new Vector2(LEDGE_X + overlap - PLAYER.width / 2, 0)
            );
            lane.points.length = 0;
            lane.corners = 0;
          }
          const { player } = lane;
          const input = {
            move: clock > RUN_AT ? 1 : 0,
            jumpPressed: clock >= JUMP_AT && clock - h < JUMP_AT,
            jumpHeld: true,
          };
          const before = player.events.length;
          player.update(h, input, { corner: lane.corrected ? corner : 0 });
          lane.corners += player.events
            .slice(before)
            .filter((event) => event.kind === "corner").length;
          lane.avatar.update(player);
          lane.points.push(
            new Vector3(
              player.position.x + PLAYER.width / 2,
              player.position.y + PLAYER.height,
              0.5
            )
          );
          lane.path.setPoints(lane.points);
          lane.sliver.scale.x = overlap;
          lane.sliver.position.x = LEDGE_X + overlap / 2;
          lane.sliver.visible = clock < JUMP_AT + 0.2;
          const onLedge = player.onGround && player.position.y > 1;
          let text = lane.corners > 0 ? "角をよけて横へずらした" : "";
          if (clock > JUMP_AT + 0.9) {
            text = onLedge ? "上の足場に乗れた" : "頭を打って落ちた";
          }
          lane.result.setText(text);
          lane.result.visible = text !== "";
        }
        const corrected = overlap <= corner;
        context.readout("頭の重なり", `${Math.round(overlap * 100)} cm`);
        context.readout(
          "右の列の補正",
          corrected ? "はたらく" : "はたらかない（重なりが大きい）"
        );
        context.caption(
          corrected
            ? "頭が角にほんの少し重なっただけなら、補正ありの列は体を横へ押し出して、ジャンプをそのまま続けさせる。補正なしの列は同じ位置から跳んでも頭を打って落ちる。"
            : "重なりが補正の幅より大きいので、どちらの列も頭を打つ。大きくぶつかったときまでずらすと、壁をすり抜けるように見えてしまうので、補正は数センチの小さな重なりだけに効かせる。"
        );
      },
    };
  },
};
