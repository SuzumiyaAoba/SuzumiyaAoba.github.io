import { Group, Mesh, SphereGeometry, Vector2 } from "three";
import { palette, perlin2, rng, standard } from "../../kit";
import {
  autopilot,
  cameraFrame,
  COURSE,
  courseView,
  GAME_VIEW,
  gameCamera,
  pictureInPicture,
  Player,
  playerView,
} from "../../platformer";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

export const demo: DemoModule = {
  alt: "爆発や着地の衝撃で画面を揺らすカメラシェイクのデモ。衝撃のたびに「トラウマ」と呼ぶ値を足し、時間とともに減らしていく。画面のずれと傾きは、トラウマの 2 乗にノイズを掛けて決めるので、大きな衝撃ほど急に強く揺れ、弱まるとすっと収まる。毎フレームの乱数で揺らすとがたがたした安っぽい揺れになるが、なめらかなノイズを使うと重みのある揺れになる。",
  camera: { position: [0, 2.5, 30], target: [0, 1.5, 0], orbit: false },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    { type: "button", key: "small", label: "小さな衝撃" },
    { type: "button", key: "big", label: "大爆発" },
    {
      type: "select",
      key: "mode",
      label: "揺らし方",
      value: "noise",
      options: [
        { value: "noise", label: "なめらかなノイズ" },
        { value: "random", label: "毎フレームの乱数" },
      ],
    },
    {
      type: "range",
      key: "amplitude",
      label: "最大のずれ",
      min: 0.1,
      max: 2,
      step: 0.05,
      value: 0.9,
    },
    {
      type: "range",
      key: "frequency",
      label: "揺れの細かさ",
      min: 2,
      max: 40,
      step: 1,
      value: 15,
    },
    {
      type: "range",
      key: "decay",
      label: "収まる速さ",
      min: 0.3,
      max: 3,
      step: 0.05,
      value: 1.2,
    },
  ],
  legend: [
    { color: palette.coral, label: "トラウマ（衝撃の強さ）" },
    { color: palette.sky, label: "画面の横のずれ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(8);
    const world = new Group();
    scene.add(world);
    courseView(COURSE, world);
    const player = new Player(COURSE, new Vector2(0, 0));
    const avatar = playerView(palette.amber);
    world.add(avatar);
    const auto = autopilot(player);
    const game = gameCamera();
    scene.add(game);
    const frame = cameraFrame(world, palette.ink);
    const blast = new Mesh(
      new SphereGeometry(1, 24, 16),
      standard("#ffb347", { emissive: 3 })
    );
    blast.visible = false;
    world.add(blast);
    const graph = historyGraph(context, {
      title: "トラウマと画面のずれ",
      min: -1,
      max: 1.2,
      series: [{ color: palette.coral }, { color: palette.sky }],
    });
    pictureInPicture(context, game, (inset) => {
      frame.visible = !inset;
    });

    let trauma = 0;
    let time = 0;
    let blastTime = 10;
    let observer = 0;
    let wasGround = true;
    let fallSpeed = 0;
    const camera2d = new Vector2(0, 2);
    const shake = new Vector2();
    let roll = 0;
    const addTrauma = (amount: number) => {
      trauma = Math.min(1, trauma + amount);
    };
    return {
      action(key) {
        if (key === "small") {
          addTrauma(0.3);
        } else if (key === "big") {
          addTrauma(0.9);
          blastTime = 0;
          blast.position.set(
            player.position.x + 3 + random() * 2,
            player.position.y + 1,
            0.5
          );
        }
      },
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        const h = Math.min(dt, 1 / 30);
        time += h;
        player.update(h, auto(h), { coyote: 0.1, buffer: 0.1 });
        avatar.update(player);
        // 高い所から着地したら、落ちてきた速さに応じて少し揺らす
        if (player.onGround && !wasGround && fallSpeed > 12) {
          addTrauma(Math.min(0.35, (fallSpeed - 12) * 0.05));
        }
        fallSpeed = Math.max(0, -player.velocity.y);
        wasGround = player.onGround;

        trauma = Math.max(0, trauma - Number(params["decay"]) * h);
        const strength = trauma * trauma; // 2 乗：弱い揺れはより弱く、強い揺れは急に強く
        const amplitude = Number(params["amplitude"]);
        const frequency = Number(params["frequency"]);
        if (params["mode"] === "noise") {
          shake
            .set(
              perlin2(time * frequency, 1.3) * 2,
              perlin2(time * frequency, 7.7) * 2
            )
            .multiplyScalar(amplitude * strength);
          roll = perlin2(time * frequency, 13.1) * 2 * 0.08 * strength;
        } else {
          shake
            .set(random() * 2 - 1, random() * 2 - 1)
            .multiplyScalar(amplitude * strength);
          roll = (random() * 2 - 1) * 0.08 * strength;
        }

        camera2d.x += (player.position.x - camera2d.x) * (1 - Math.exp(-5 * h));
        camera2d.y +=
          (player.position.y + 1.5 - camera2d.y) * (1 - Math.exp(-5 * h));
        observer += (camera2d.x - observer) * (1 - Math.exp(-3 * h));
        world.position.x = -observer;
        const shaken = camera2d.clone().add(shake);
        game.position.set(shaken.x - observer, shaken.y, GAME_VIEW.distance);
        game.lookAt(shaken.x - observer, shaken.y, 0);
        game.rotateZ(roll);
        frame.set(
          shaken,
          GAME_VIEW.halfHeight * GAME_VIEW.aspect,
          GAME_VIEW.halfHeight
        );

        blastTime += h;
        blast.visible = blastTime < 0.5;
        blast.scale.setScalar(0.5 + blastTime * 6);
        graph.push([trauma, shake.x / Math.max(amplitude, 0.01)]);
        context.readout("トラウマ", trauma.toFixed(2));
        context.caption(
          params["mode"] === "noise"
            ? "衝撃のたびにトラウマを足し、一定の速さで減らす。揺れの大きさはトラウマの 2 乗で、向きはなめらかなノイズで決めるので、重みのある揺れになり、弱まると自然に収まる。横・縦のずれに加えて、少しだけ画面を傾けている。"
            : "毎フレーム乱数でずらすと、揺れの向きが 1 フレームごとにばらばらに飛び、がたがたした落ち着かない揺れになる。フレームレートによって揺れの見え方も変わってしまう。"
        );
      },
    };
  },
};
