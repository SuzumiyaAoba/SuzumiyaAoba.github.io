import { Group, Mesh, MeshBasicMaterial, RingGeometry, Vector2 } from "three";
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
  alt: "カメラを、プレイヤーの進む方向へ少し先にずらす先読み追従のデモ。プレイヤーを画面の真ん中に置くと、進む先が画面の半分しか見えず、穴や敵に気付くのが遅れる。先読みでは、向いている方向や速さに応じてカメラの注視点を前にずらすので、進む先が広く見える。向きを変えたときに画面が急に振られないよう、ずれはなめらかに追いかける。",
  camera: { position: [0, 2.5, 30], target: [0, 1.5, 0], orbit: false },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "先読みの方法",
      value: "velocity",
      options: [
        { value: "none", label: "先読みなし（中心に置く）" },
        { value: "facing", label: "向いている方向へ" },
        { value: "velocity", label: "速さに応じて" },
      ],
    },
    {
      type: "range",
      key: "distance",
      label: "先読みの距離",
      min: 0,
      max: 7,
      step: 0.1,
      value: 4,
    },
    {
      type: "range",
      key: "smooth",
      label: "ずれの追いかけ方",
      min: 0.5,
      max: 20,
      step: 0.5,
      value: 2.5,
      hint: "小さいほど、向きを変えたときにカメラがゆっくり振り向きます。",
    },
  ],
  legend: [
    { color: palette.ink, label: "ゲームカメラに映る範囲" },
    { color: palette.coral, label: "カメラの注視点（先読みした位置）" },
    { color: palette.sky, label: "プレイヤーより前に見えている距離" },
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
    const marker = new Mesh(
      new RingGeometry(0.25, 0.38, 32),
      new MeshBasicMaterial({ color: palette.coral })
    );
    world.add(marker);
    const graph = historyGraph(context, {
      title: "進む方向に見えている距離（m）",
      min: 0,
      max: 16,
      series: [{ color: palette.sky }],
    });
    pictureInPicture(context, game, (inset) => {
      frame.visible = !inset;
      marker.visible = !inset;
    });

    const offset = new Vector2();
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
        player.update(h, manualTimer > 0 ? manual : auto(h), {
          coyote: 0.1,
          buffer: 0.1,
        });
        avatar.update(player);

        // 先読みのずれ：向き、または速さに比例して前へ
        const mode = String(params["mode"]);
        const distance = Number(params["distance"]);
        const wanted = new Vector2();
        if (mode === "facing") {
          wanted.x = player.facing * distance;
        } else if (mode === "velocity") {
          wanted.x = (player.velocity.x / 6.5) * distance;
        }
        offset.lerp(wanted, 1 - Math.exp(-Number(params["smooth"]) * h));
        const focus = new Vector2(
          player.position.x + offset.x,
          player.position.y + 1.5
        );
        camera2d.x = focus.x;
        camera2d.y += (focus.y - camera2d.y) * (1 - Math.exp(-6 * h));

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
        marker.position.set(camera2d.x, camera2d.y, 1.1);
        const halfWidth = GAME_VIEW.halfHeight * GAME_VIEW.aspect;
        const ahead =
          player.facing > 0
            ? camera2d.x + halfWidth - player.position.x
            : player.position.x - (camera2d.x - halfWidth);
        graph.push([ahead]);
        context.readout("前に見えている距離", `${ahead.toFixed(1)} m`);
        context.caption(
          mode === "none"
            ? "プレイヤーが常に画面の真ん中なので、進む先は画面の半分（約 9 m）しか見えない。後ろの、もう通り過ぎた場所に画面の半分を使っている。"
            : "カメラの注視点（赤い輪）を進む方向へずらすので、進む先が広く見える。向きを変えたときは、ずれがなめらかに反対側へ移るので、画面が急に振られない。"
        );
      },
    };
  },
};
