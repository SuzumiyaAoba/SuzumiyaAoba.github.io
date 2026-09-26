import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, Vector2 } from "three";
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

type Rect = { minX: number; minY: number; maxX: number; maxY: number };

/** ステージ全体（背景を描いてある範囲）。 */
const LEVEL: Rect = { minX: -8, minY: -2, maxX: 66, maxY: 12 };
/** 部屋ごとの制限領域。天井の高さが違う 2 部屋。 */
const ROOMS: readonly Rect[] = [
  { minX: -8, minY: -2, maxX: 31, maxY: 8.5 },
  { minX: 31, minY: -2, maxX: 66, maxY: 12 },
];

/** 1 軸ぶん：幅が足りなければ中央、足りれば [min + half, max - half] に収める。 */
function clampAxis(value: number, min: number, max: number, half: number) {
  return max - min < half * 2
    ? (min + max) / 2
    : Math.min(max - half, Math.max(min + half, value));
}

/** 画面（中心 ± 半分の幅・高さ）が rect の中に収まるよう、中心を押し戻す。 */
function confine(
  center: Vector2,
  rect: Rect,
  halfWidth: number,
  halfHeight: number
) {
  return new Vector2(
    clampAxis(center.x, rect.minX, rect.maxX, halfWidth),
    clampAxis(center.y, rect.minY, rect.maxY, halfHeight)
  );
}

/** 画面のうち、ステージの外（何も作っていない場所）が映っている割合。 */
function outsideRatio(center: Vector2, halfWidth: number, halfHeight: number) {
  const overlapX = Math.max(
    0,
    Math.min(center.x + halfWidth, LEVEL.maxX) -
      Math.max(center.x - halfWidth, LEVEL.minX)
  );
  const overlapY = Math.max(
    0,
    Math.min(center.y + halfHeight, LEVEL.maxY) -
      Math.max(center.y - halfHeight, LEVEL.minY - 3)
  );
  return 1 - (overlapX * overlapY) / (4 * halfWidth * halfHeight);
}

export const demo: DemoModule = {
  alt: "カメラが動ける範囲を決めて、ステージの外が画面に映らないようにするカメラ制限領域（コンファイナー）のデモ。プレイヤーを追うだけのカメラは、ステージの端に来ると、作っていない真っ暗な場所まで映してしまう。制限領域があると、カメラの画面がその枠からはみ出さないよう押し戻すので、端ではプレイヤーが画面の中央からずれる。部屋ごとに枠を分けると、天井の低い部屋では上の空間を映さずにすむ。",
  camera: { position: [0, 3, 34], target: [0, 3, 0], orbit: false },
  studio: { floor: false, fog: false, background: "#10161f" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "カメラの制限",
      value: "rooms",
      options: [
        { value: "none", label: "制限なし（追いかけるだけ）" },
        { value: "level", label: "ステージ全体の枠" },
        { value: "rooms", label: "部屋ごとの枠" },
      ],
    },
    {
      type: "range",
      key: "smooth",
      label: "部屋を移るときの動きの速さ",
      min: 1,
      max: 20,
      step: 0.5,
      value: 4,
    },
  ],
  legend: [
    { color: palette.ink, label: "ゲームカメラに映る範囲" },
    { color: palette.lime, label: "カメラ制限領域（今の部屋）" },
    { color: palette.muted, label: "ほかの部屋の制限領域" },
  ],
  hint: "←→ で移動、スペースでジャンプ（操作しないと自動で左右に往復します）。",
  setup(context) {
    const { scene, params } = context;
    const world = new Group();
    scene.add(world);
    // ステージとして作ってある範囲だけ背景を塗る。外側は何もない
    const backdrop = new Mesh(
      new PlaneGeometry(LEVEL.maxX - LEVEL.minX, LEVEL.maxY - LEVEL.minY + 3),
      new MeshBasicMaterial({ color: "#35546f" })
    );
    backdrop.position.set(
      (LEVEL.minX + LEVEL.maxX) / 2,
      (LEVEL.minY - 3 + LEVEL.maxY) / 2,
      -1.5
    );
    world.add(backdrop);
    const lowCeiling = new Mesh(
      new PlaneGeometry(ROOMS[0] ? ROOMS[0].maxX - ROOMS[0].minX : 1, 3.5),
      new MeshBasicMaterial({ color: "#26394d" })
    );
    lowCeiling.position.set(
      ((ROOMS[0]?.minX ?? 0) + (ROOMS[0]?.maxX ?? 0)) / 2,
      (ROOMS[0]?.maxY ?? 0) + 1.75,
      -1.4
    );
    world.add(lowCeiling);
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
    const roomFrames = ROOMS.map(() => cameraFrame(world, palette.muted));
    const activeFrame = cameraFrame(world, palette.lime);
    const graph = historyGraph(context, {
      title: "ステージの外が映っている割合（%）",
      min: 0,
      max: 60,
      series: [{ color: palette.coral }],
    });
    pictureInPicture(context, game, (inset) => {
      frame.visible = !inset;
      activeFrame.visible = !inset && params["mode"] !== "none";
      for (const roomFrame of roomFrames) {
        roomFrame.visible = !inset && params["mode"] === "rooms";
      }
    });

    const halfWidth = GAME_VIEW.halfHeight * GAME_VIEW.aspect;
    const { halfHeight } = GAME_VIEW;
    const camera2d = new Vector2(0, 3);
    let observer = 0;
    let roomIndex = 0;
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

        const mode = String(params["mode"]);
        const follow = new Vector2(player.position.x, player.position.y + 1.5);
        const found = ROOMS.findIndex(
          (room) =>
            player.position.x >= room.minX && player.position.x < room.maxX
        );
        if (found !== -1) {
          roomIndex = found;
        }
        const room = ROOMS[roomIndex] ?? LEVEL;
        let target = follow;
        if (mode === "level") {
          target = confine(follow, LEVEL, halfWidth, halfHeight);
        } else if (mode === "rooms") {
          target = confine(follow, room, halfWidth, halfHeight);
        }
        camera2d.lerp(target, 1 - Math.exp(-Number(params["smooth"]) * h));

        observer += (camera2d.x - observer) * (1 - Math.exp(-3 * h));
        world.position.x = -observer;
        game.position.set(
          camera2d.x - observer,
          camera2d.y,
          GAME_VIEW.distance
        );
        game.lookAt(camera2d.x - observer, camera2d.y, 0);
        frame.set(camera2d, halfWidth, halfHeight);
        const shown = mode === "rooms" ? room : LEVEL;
        activeFrame.set(
          new Vector2(
            (shown.minX + shown.maxX) / 2,
            (shown.minY + shown.maxY) / 2
          ),
          (shown.maxX - shown.minX) / 2,
          (shown.maxY - shown.minY) / 2
        );
        for (const [index, roomFrame] of roomFrames.entries()) {
          const rect = ROOMS[index];
          if (rect) {
            roomFrame.set(
              new Vector2(
                (rect.minX + rect.maxX) / 2,
                (rect.minY + rect.maxY) / 2
              ),
              (rect.maxX - rect.minX) / 2 - 0.15,
              (rect.maxY - rect.minY) / 2 - 0.15
            );
          }
        }
        const outside = outsideRatio(camera2d, halfWidth, halfHeight);
        graph.push([outside * 100]);
        context.readout(
          "ステージの外が映る割合",
          `${Math.round(outside * 100)}%`
        );
        context.readout(
          "今の部屋",
          mode === "rooms" ? `${roomIndex + 1} 番目` : "—"
        );
        let caption =
          "カメラがプレイヤーを追うだけなので、ステージの端では作っていない暗い場所（外側）まで映ってしまう。左下の小窓の端に、何もない空間が見える。";
        if (mode === "level") {
          caption =
            "カメラの画面（白い枠）が緑の枠からはみ出さないよう、中心を押し戻す。端に来るとカメラは止まり、プレイヤーだけが画面の端へ寄っていく。外側はまったく映らない。";
        } else if (mode === "rooms") {
          caption =
            "部屋ごとに枠を分けると、天井の低い左の部屋では上の空間を映さずにすむ。部屋を移ったときは、新しい枠へなめらかにカメラを動かす。";
        }
        context.caption(caption);
      },
    };
  },
};
