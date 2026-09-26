import { Group, Vector2 } from "three";
import { palette } from "../../kit";
import {
  autopilot,
  cameraFrame,
  COURSE,
  courseView,
  GAME_VIEW,
  gameCamera,
  keyboard,
  pictureInPicture,
  Player,
  playerView,
} from "../../platformer";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

export const demo: DemoModule = {
  alt: "横スクロールのアクションゲームで、カメラがプレイヤーを追いかける方法を比べるデモ。常にプレイヤーを画面の中心に置くと、ジャンプのたびに画面が上下に揺れて酔いやすい。デッドゾーン（画面中央の黄色い枠）の中ではカメラを動かさず、プレイヤーが枠からはみ出した分だけカメラを動かすと、小さな動きでは画面が止まったままになる。右下の小窓が、プレイヤーが実際に見る画面。",
  camera: { position: [0, 2.5, 30], target: [0, 1.5, 0], orbit: false },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "カメラの追い方",
      value: "deadzone",
      options: [
        { value: "locked", label: "常に中心に置く" },
        { value: "deadzone", label: "デッドゾーン" },
      ],
    },
    {
      type: "range",
      key: "width",
      label: "デッドゾーンの幅",
      min: 0.2,
      max: 8,
      step: 0.1,
      value: 3,
    },
    {
      type: "range",
      key: "height",
      label: "デッドゾーンの高さ",
      min: 0.2,
      max: 6,
      step: 0.1,
      value: 3.2,
    },
    {
      type: "range",
      key: "smooth",
      label: "追いつく速さ",
      min: 1,
      max: 30,
      step: 0.5,
      value: 8,
      hint: "枠からはみ出した分を、どれだけ素早く取り戻すか。",
    },
  ],
  legend: [
    { color: palette.ink, label: "ゲームカメラに映る範囲" },
    { color: palette.amber, label: "デッドゾーン" },
    { color: palette.sky, label: "カメラの高さの動き（グラフ）" },
  ],
  hint: "←→ で移動、スペースでジャンプ（操作しないと自動で走ります）。",
  setup(context) {
    const { scene, params } = context;
    const world = new Group();
    scene.add(world);
    courseView(COURSE, world);
    const player = new Player(COURSE, new Vector2(0, 0));
    const avatar = playerView(palette.amber);
    world.add(avatar);
    const auto = autopilot(player);
    const keys = keyboard();
    let manualTimer = 0;
    const game = gameCamera();
    scene.add(game);
    const frame = cameraFrame(world, palette.ink);
    const zone = cameraFrame(world, palette.amber);
    const graph = historyGraph(context, {
      title: "カメラの高さ",
      min: -1,
      max: 5,
      series: [{ color: palette.sky }],
    });
    pictureInPicture(context, game, (inset) => {
      frame.visible = !inset;
      zone.visible = !inset;
    });

    const camera2d = new Vector2(0, 2);
    let observer = 0;
    return {
      dispose() {
        keys.dispose();
      },
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        const h = Math.min(dt, 1 / 30);
        const manual = keys.read();
        if (keys.active() || manual.jumpPressed) {
          manualTimer = 3;
        }
        manualTimer -= h;
        const input = manualTimer > 0 ? manual : auto(h);
        player.update(h, input, { coyote: 0.1, buffer: 0.1 });
        avatar.update(player);

        // カメラの目標：プレイヤーの胸のあたり
        const focus = new Vector2(player.position.x, player.position.y + 1.5);
        const halfW = Number(params["width"]) / 2;
        const halfH = Number(params["height"]) / 2;
        if (params["mode"] === "locked") {
          camera2d.copy(focus);
        } else {
          // デッドゾーン：枠からはみ出した分だけを、追いつく速さで取り戻す
          const target = camera2d.clone();
          if (focus.x > camera2d.x + halfW) {
            target.x = focus.x - halfW;
          } else if (focus.x < camera2d.x - halfW) {
            target.x = focus.x + halfW;
          }
          if (focus.y > camera2d.y + halfH) {
            target.y = focus.y - halfH;
          } else if (focus.y < camera2d.y - halfH) {
            target.y = focus.y + halfH;
          }
          camera2d.lerp(target, 1 - Math.exp(-Number(params["smooth"]) * h));
        }
        // 観察用の視点は、ゲームカメラをゆっくり追う（世界の方を動かす）
        observer += (camera2d.x - observer) * (1 - Math.exp(-3 * h));
        world.position.x = -observer;
        game.position.set(
          camera2d.x - observer,
          camera2d.y,
          GAME_VIEW.distance
        );
        game.lookAt(camera2d.x - observer, camera2d.y, 0);
        frame.set(
          camera2d,
          GAME_VIEW.halfHeight * GAME_VIEW.aspect,
          GAME_VIEW.halfHeight
        );
        zone.set(camera2d, halfW, halfH);
        zone.visible = params["mode"] === "deadzone";
        graph.push([camera2d.y]);
        context.readout("操作", manualTimer > 0 ? "キーボード" : "自動");
        context.caption(
          params["mode"] === "locked"
            ? "カメラが常にプレイヤーの真ん中に固定されているので、ジャンプや段差のたびに画面全体が上下に揺れる。右下のグラフのカメラの高さが、跳ねるたびにぎざぎざに動く。"
            : "プレイヤーが黄色い枠（デッドゾーン）の中にいる間はカメラを止め、はみ出した分だけ動かす。小さなジャンプでは画面が揺れず、段差を上ったときだけカメラがついてくる。"
        );
      },
    };
  },
};
