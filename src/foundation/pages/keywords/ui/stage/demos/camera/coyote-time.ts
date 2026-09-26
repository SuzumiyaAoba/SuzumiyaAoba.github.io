import { Group, Vector2, Vector3 } from "three";
import { palette, polyline } from "../../kit";
import {
  courseView,
  gapCourse,
  Player,
  playerView,
  timelineHud,
} from "../../platformer";
import type { DemoModule } from "../../types";

const PLATFORM = 7;
const GAP = 3.2;
const COUNT = 7;

export const demo: DemoModule = {
  alt: "足場の端から落ち始めた直後でも、少しの間だけジャンプを受け付けるコヨーテタイムのデモ。プレイヤーは足場の端でわざと少し遅れてジャンプボタンを押す。コヨーテタイムがないと、押したときにはもう足が離れているのでジャンプできず、穴に落ちる。猶予があると、押すのが少し遅れても跳べる。漫画のコヨーテが崖の外で一瞬止まってから落ちる様子が名前の由来。",
  camera: { position: [0, 2, 20], target: [0, 0.5, 0], orbit: false },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "range",
      key: "coyote",
      label: "コヨーテタイム",
      min: 0,
      max: 0.25,
      step: 0.01,
      value: 0.1,
      format: (value) => `${Math.round(value * 1000)} ms`,
    },
    {
      type: "range",
      key: "late",
      label: "ボタンを押すのが遅れる時間",
      min: 0,
      max: 0.2,
      step: 0.01,
      value: 0.07,
      format: (value) => `${Math.round(value * 1000)} ms`,
      hint: "人間の反応は 60fps で数フレーム遅れるのがふつうです。",
    },
  ],
  legend: [
    { color: palette.lime, label: "コヨーテタイム（猶予）" },
    { color: palette.coral, label: "足場を離れた瞬間" },
    { color: palette.amber, label: "ジャンプを押した瞬間" },
  ],
  setup(context) {
    const { scene, params } = context;
    const blocks = gapCourse(COUNT, PLATFORM, GAP);
    const world = new Group();
    scene.add(world);
    courseView(blocks, world);
    const start = new Vector2(-2, 0);
    let player = new Player(blocks, start.clone());
    const avatar = playerView(palette.amber);
    world.add(avatar);
    const trail = polyline([], palette.amber, { width: 2, opacity: 0.6 });
    world.add(trail);
    const trailPoints: Vector3[] = [];
    const timeline = timelineHud(context, "足場を離れてからジャンプを押すまで");

    let observer = 0;
    let pending = -1;
    let leftAt = 0;
    let pressedAt = 0;
    let jumpedOk = true;
    let success = 0;
    let fail = 0;
    return {
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        const h = Math.min(dt, 1 / 60);
        const coyote = Number(params["coyote"]);
        let jumpPressed = false;
        // 自動操縦：足場から離れた（走って落ち始めた）のを見てから、遅れてボタンを押す
        const wasGround = player.onGround;
        if (pending >= 0) {
          pending -= h;
          if (pending < 0) {
            jumpPressed = true;
            pressedAt = player.time;
          }
        }
        player.update(h, { move: 1, jumpPressed, jumpHeld: true }, { coyote });
        if (wasGround && !player.onGround && player.velocity.y <= 0) {
          leftAt = player.time;
          pending = Number(params["late"]);
          if (pending === 0) {
            pending = 1e-6;
          }
        }
        if (jumpPressed) {
          const last = player.events.at(-1);
          jumpedOk =
            last !== undefined &&
            last.time === player.time &&
            last.kind !== "miss";
          if (jumpedOk) {
            success++;
          } else {
            fail++;
          }
        }
        // 落ちたら、直前の足場からやり直す。コースの端まで来たら最初へ
        if (
          player.position.y < -7 ||
          player.position.x > (COUNT - 1) * (PLATFORM + GAP) + PLATFORM - 1
        ) {
          const segment = Math.floor(player.position.x / (PLATFORM + GAP));
          const restart =
            player.position.y < -7
              ? new Vector2(Math.max(-2, segment * (PLATFORM + GAP) + 1), 0.5)
              : start.clone();
          player = new Player(blocks, restart);
          trailPoints.length = 0;
          pending = -1;
        }
        avatar.update(player);
        trailPoints.push(
          new Vector3(player.position.x, player.position.y + 0.5, 0.4)
        );
        if (trailPoints.length > 240) {
          trailPoints.shift();
        }
        trail.setPoints(trailPoints);
        observer += (player.position.x + 3 - observer) * (1 - Math.exp(-4 * h));
        world.position.x = -observer;
        timeline.draw(
          [leftAt - 0.08, leftAt + 0.28],
          [leftAt, leftAt + coyote],
          palette.lime,
          [
            { time: leftAt, color: palette.coral, label: "離れた" },
            {
              time:
                pressedAt >= leftAt
                  ? pressedAt
                  : leftAt + Number(params["late"]),
              color: palette.amber,
              label: jumpedOk ? "押した（成功）" : "押した（失敗）",
            },
          ]
        );
        context.readout("ジャンプ成功", `${success}`);
        context.readout("間に合わず落下", `${fail}`);
        context.caption(
          Number(params["late"]) <= coyote
            ? "足場を離れてから少し遅れてボタンを押しても、猶予（緑）の間なので地面にいる扱いでジャンプできる。遊ぶ人は「端ぎりぎりで跳べた」と感じ、理不尽な落下がなくなる。"
            : "ボタンを押したのが猶予より遅いので、もう空中にいる扱いになり、ジャンプできずに穴へ落ちる。画面上では足場の端を踏み切ったつもりなのに落ちるので、遊ぶ人は理不尽に感じる。"
        );
      },
    };
  },
};
