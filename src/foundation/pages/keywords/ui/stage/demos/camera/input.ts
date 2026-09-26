import { Group, Vector2, Vector3 } from "three";
import { palette, polyline } from "../../kit";
import {
  courseView,
  gapCourse,
  PLAYER,
  Player,
  playerView,
  timelineHud,
} from "../../platformer";
import type { Block } from "../../platformer";
import type { DemoModule } from "../../types";

// 1 回のジャンプで進む距離（約 4.6 m）と、足場 1 つ分の間隔をそろえてある。
// 着地した瞬間に跳べば次の足場の同じ位置に降りられるが、跳ばなければ足場の端から落ちる。
const PLATFORM = 2.4;
const GAP = 2.2;
const TAKEOFF = 0.6;
const COUNT = 10;

/** 真下の足場の上面の高さ。 */
function groundBelow(blocks: readonly Block[], x: number, y: number) {
  let best = Number.NEGATIVE_INFINITY;
  for (const block of blocks) {
    const top = block.y + block.h;
    if (x > block.x && x < block.x + block.w && top <= y + 1e-3) {
      best = Math.max(best, top);
    }
  }
  return best;
}

export const demo: DemoModule = {
  alt: "着地の少し前に押したジャンプボタンを覚えておき、着地した瞬間に跳ばせる入力バッファのデモ。小さな足場が穴を挟んで並んでいて、着地したらすぐに跳ばないと落ちてしまう。プレイヤーは着地の少し前にボタンを押す。入力バッファがないと、押した瞬間はまだ空中なので無視され、着地しても跳ばずに穴へ落ちる。バッファがあれば、押した入力を覚えておいて着地と同時に跳ぶ。",
  camera: { position: [0, 2, 20], target: [0, 0.5, 0], orbit: false },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "range",
      key: "buffer",
      label: "入力バッファ",
      min: 0,
      max: 0.25,
      step: 0.01,
      value: 0.12,
      format: (value) => `${Math.round(value * 1000)} ms`,
    },
    {
      type: "range",
      key: "early",
      label: "着地より早く押す時間",
      min: 0,
      max: 0.2,
      step: 0.01,
      value: 0.08,
      format: (value) => `${Math.round(value * 1000)} ms`,
    },
  ],
  legend: [
    { color: palette.sky, label: "入力を覚えている時間（バッファ）" },
    { color: palette.amber, label: "ジャンプを押した瞬間" },
    { color: palette.coral, label: "着地した瞬間" },
  ],
  setup(context) {
    const { scene, params } = context;
    const blocks = gapCourse(COUNT, PLATFORM, GAP);
    const world = new Group();
    scene.add(world);
    courseView(blocks, world);
    const start = new Vector2(-3, 0);
    let player = new Player(blocks, start.clone());
    const avatar = playerView(palette.amber);
    world.add(avatar);
    const trail = polyline([], palette.amber, { width: 2, opacity: 0.6 });
    world.add(trail);
    const trailPoints: Vector3[] = [];
    const timeline = timelineHud(context, "ジャンプを押してから着地するまで");

    let observer = 0;
    let pressedThisAir = false;
    let pressedAt = -1;
    let landedAt = -1;
    let success = 0;
    let fail = 0;
    let waitingResult = false;
    return {
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        const h = Math.min(dt, 1 / 60);
        const buffer = Number(params["buffer"]);
        const early = Number(params["early"]);
        let jumpPressed = false;
        // 自動操縦：落下中、着地までの時間が early を切ったらボタンを押す
        if (player.onGround) {
          pressedThisAir = false;
          // 最初の足場では、自分で跳び始める
          if (
            player.position.x >= TAKEOFF &&
            player.position.x < TAKEOFF + 0.5 &&
            !player.jumped
          ) {
            jumpPressed = true;
          }
        } else if (!pressedThisAir && player.velocity.y < 0) {
          const ground = groundBelow(
            blocks,
            player.position.x + player.velocity.x * 0.1,
            player.position.y
          );
          if (Number.isFinite(ground)) {
            const drop = player.position.y - ground;
            const v = -player.velocity.y;
            const g = PLAYER.gravity * 1.2;
            const timeToLand = (-v + Math.sqrt(v * v + 2 * g * drop)) / g;
            if (timeToLand <= early + h) {
              jumpPressed = true;
              pressedThisAir = true;
              pressedAt = player.time + h;
              waitingResult = true;
            }
          }
        }
        const wasGround = player.onGround;
        player.update(h, { move: 1, jumpPressed, jumpHeld: true }, { buffer });
        if (!wasGround && player.onGround) {
          landedAt = player.time;
        }
        // 結果の判定：着地した直後に跳べたか
        if (waitingResult && player.onGround && player.time - landedAt > 0.05) {
          fail++;
          waitingResult = false;
        } else if (
          waitingResult &&
          !player.onGround &&
          player.velocity.y > 5 &&
          landedAt > 0 &&
          player.time - landedAt < 0.05
        ) {
          success++;
          waitingResult = false;
        }
        if (
          player.position.y < -7 ||
          player.position.x > (COUNT - 1) * (PLATFORM + GAP) + PLATFORM - 0.5
        ) {
          player = new Player(blocks, start.clone());
          trailPoints.length = 0;
          pressedThisAir = false;
          waitingResult = false;
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
        const center = Math.max(pressedAt, 0);
        timeline.draw(
          [center - 0.08, center + 0.3],
          buffer > 0 ? [center, center + buffer] : null,
          palette.sky,
          [
            { time: center, color: palette.amber, label: "押した" },
            {
              time: landedAt >= center - 0.01 ? landedAt : center + early,
              color: palette.coral,
              label: "着地",
            },
          ]
        );
        context.readout("着地と同時に跳べた", `${success}`);
        context.readout("押したのに跳ばなかった", `${fail}`);
        context.caption(
          early <= buffer
            ? "着地の少し前に押したジャンプを、入力バッファ（青）の間だけ覚えておく。着地した瞬間にまだ覚えていれば、そこで跳ぶ。遊ぶ人は「押したとおりに跳んだ」と感じる。"
            : "押した瞬間はまだ空中なのでジャンプできず、入力はそのまま捨てられる。着地しても跳ばないので、小さな足場から落ちてしまう。遊ぶ人は「ボタンを押したのに跳ばなかった」と感じる。"
        );
      },
    };
  },
};
