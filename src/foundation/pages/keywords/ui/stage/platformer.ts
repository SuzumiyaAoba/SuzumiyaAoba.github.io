import {
  BoxGeometry,
  Group,
  Mesh,
  PerspectiveCamera,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import type { Object3D } from "three";
import { palette, polyline, standard } from "./kit";
import type { DemoContext } from "./types";

/** 足場（左下 x・y、幅 w・高さ h）。 */
export type Block = { x: number; y: number; w: number; h: number };

export const PLAYER = {
  width: 0.6,
  height: 1,
  run: 6.5,
  accel: 45,
  jump: 12.5,
  gravity: 34,
} as const;

/** 標準のコース：段差、穴、浮き足場、天井のある通路、壁。 */
export const COURSE: readonly Block[] = [
  { x: -6, y: -2, w: 18, h: 2 },
  { x: 14, y: -2, w: 8, h: 2 },
  { x: 16, y: 1.4, w: 3, h: 0.5 },
  { x: 24, y: -2, w: 6, h: 3 },
  { x: 32, y: -2, w: 10, h: 2 },
  { x: 34, y: 2.3, w: 6, h: 0.6 },
  { x: 44, y: -2, w: 4, h: 4 },
  { x: 50, y: -2, w: 14, h: 2 },
  { x: 53, y: 2.5, w: 2.5, h: 0.5 },
  { x: 58, y: 1.6, w: 2, h: 0.5 },
  { x: 64, y: -2, w: 2, h: 9 },
  { x: -8, y: -2, w: 2, h: 9 },
];

export type Input = { move: number; jumpPressed: boolean; jumpHeld: boolean };

export type PlayerOptions = {
  /** 足場を離れてからジャンプを受け付ける猶予（秒）。 */
  coyote?: number;
  /** 着地前に押したジャンプを覚えておく時間（秒）。 */
  buffer?: number;
  /** 天井の角にぶつかったとき、横へずらして通す最大距離（m）。 */
  corner?: number;
  /** 頂点付近（上下の速さが apexThreshold 未満）で重力に掛ける倍率。1 で変化なし。 */
  apexHang?: number;
  /** 「頂点付近」とみなす上下の速さ（m/s）。 */
  apexThreshold?: number;
  /** ボタンを離して上昇中のとき重力に掛ける倍率（押す長さで高さが変わる）。1 で変化なし。 */
  variableJump?: number;
  /** 落下中に重力に掛ける倍率。 */
  fallMultiplier?: number;
};

export type JumpEvent = {
  time: number;
  kind: "jump" | "miss" | "coyote" | "buffer" | "corner";
};

/** 横スクロールのプレイヤー（軸ごとに当たり判定を解く、よくある作り）。 */
export class Player {
  readonly position = new Vector2(0, 0);
  readonly velocity = new Vector2();
  onGround = false;
  facing = 1;
  time = 0;
  sinceGround = 0;
  sincePressed = Number.POSITIVE_INFINITY;
  jumped = false;
  landedAt = 0;
  leftGroundAt = 0;
  events: JumpEvent[] = [];
  readonly blocks: readonly Block[];

  constructor(blocks: readonly Block[], start: Vector2) {
    this.blocks = blocks;
    this.position.copy(start);
  }

  private overlaps(x: number, y: number) {
    const hw = PLAYER.width / 2;
    for (const block of this.blocks) {
      if (
        x + hw > block.x &&
        x - hw < block.x + block.w &&
        y + PLAYER.height > block.y &&
        y < block.y + block.h
      ) {
        return block;
      }
    }
    return null;
  }

  update(dt: number, input: Input, options: PlayerOptions = {}) {
    this.time += dt;
    // 横の動き：入力へ向かって加速する
    const targetVx = input.move * PLAYER.run;
    const change = PLAYER.accel * dt;
    this.velocity.x += Math.max(
      -change,
      Math.min(change, targetVx - this.velocity.x)
    );
    if (Math.abs(input.move) > 0.1) {
      this.facing = Math.sign(input.move);
    }
    // ジャンプの受付：押した時刻を覚え、条件を満たした瞬間に跳ぶ
    if (input.jumpPressed) {
      this.sincePressed = 0;
    } else {
      this.sincePressed += dt;
    }
    this.sinceGround = this.onGround ? 0 : this.sinceGround + dt;
    const buffer = options.buffer ?? 0;
    const coyote = options.coyote ?? 0;
    const wantsJump = this.sincePressed <= buffer + 1e-6;
    const canJump =
      !this.jumped && (this.onGround || this.sinceGround <= coyote);
    if (wantsJump && canJump) {
      this.velocity.y = PLAYER.jump;
      this.jumped = true;
      let kind: JumpEvent["kind"] = "coyote";
      if (this.onGround) {
        kind = this.sincePressed > 1e-6 ? "buffer" : "jump";
      }
      this.events.push({ time: this.time, kind });
      this.sincePressed = Number.POSITIVE_INFINITY;
      this.onGround = false;
    } else if (input.jumpPressed && !canJump && !(buffer > 0)) {
      this.events.push({ time: this.time, kind: "miss" });
    }
    // 重力：頂点付近で弱める・ボタンを離したら強める
    let { gravity } = PLAYER;
    if (
      input.jumpHeld &&
      Math.abs(this.velocity.y) < (options.apexThreshold ?? 2.5)
    ) {
      gravity *= options.apexHang ?? 1;
    }
    if (!input.jumpHeld && this.velocity.y > 0) {
      gravity *= options.variableJump ?? 1;
    }
    if (this.velocity.y < 0) {
      gravity *= options.fallMultiplier ?? 1.2;
    }
    this.velocity.y = Math.max(-22, this.velocity.y - gravity * dt);

    // 横に動いて、ぶつかれば押し戻す
    let x = this.position.x + this.velocity.x * dt;
    const hitX = this.overlaps(x, this.position.y);
    if (hitX) {
      x =
        this.velocity.x > 0
          ? hitX.x - PLAYER.width / 2 - 1e-4
          : hitX.x + hitX.w + PLAYER.width / 2 + 1e-4;
      this.velocity.x = 0;
    }
    this.position.x = x;
    // 縦に動いて、ぶつかれば押し戻す
    let y = this.position.y + this.velocity.y * dt;
    const hitY = this.overlaps(x, y);
    const wasGround = this.onGround;
    this.onGround = false;
    if (hitY) {
      if (this.velocity.y > 0) {
        // 天井の角：少しだけ横にずらせば通れるなら通す（コーナー補正）
        const corner = options.corner ?? 0;
        const hw = PLAYER.width / 2;
        const leftGap = x + hw - hitY.x;
        const rightGap = hitY.x + hitY.w - (x - hw);
        if (
          corner > 0 &&
          leftGap < corner &&
          !this.overlaps(hitY.x - hw - 1e-3, y)
        ) {
          this.position.x = hitY.x - hw - 1e-3;
          this.events.push({ time: this.time, kind: "corner" });
        } else if (
          corner > 0 &&
          rightGap < corner &&
          !this.overlaps(hitY.x + hitY.w + hw + 1e-3, y)
        ) {
          this.position.x = hitY.x + hitY.w + hw + 1e-3;
          this.events.push({ time: this.time, kind: "corner" });
        } else {
          y = hitY.y - PLAYER.height - 1e-4;
          this.velocity.y = 0;
        }
      } else {
        y = hitY.y + hitY.h + 1e-4;
        this.velocity.y = 0;
        this.onGround = true;
        this.jumped = false;
        if (!wasGround) {
          this.landedAt = this.time;
        }
      }
    }
    if (wasGround && !this.onGround) {
      this.leftGroundAt = this.time;
    }
    this.position.y = y;
  }

  /** 足元の少し先に地面があるか（自動操縦用）。 */
  groundAhead(distance: number) {
    const probeX = this.position.x + this.facing * distance;
    return this.overlaps(probeX, this.position.y - 0.3) !== null;
  }

  /** 正面に壁があるか（自動操縦用）。 */
  wallAhead(distance: number) {
    return (
      this.overlaps(
        this.position.x + this.facing * distance,
        this.position.y + 0.3
      ) !== null
    );
  }
}

/** コースを箱で描く。 */
export function courseView(blocks: readonly Block[], parent: Object3D) {
  const top = standard("#7aa35a", { roughness: 0.8 });
  const dirt = standard("#6b5140", { roughness: 0.9 });
  for (const block of blocks) {
    const mesh = new Mesh(new BoxGeometry(block.w, block.h, 2), dirt);
    mesh.position.set(block.x + block.w / 2, block.y + block.h / 2, 0);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    const grass = new Mesh(new BoxGeometry(block.w, 0.12, 2.02), top);
    grass.position.set(block.x + block.w / 2, block.y + block.h - 0.06, 0);
    grass.receiveShadow = true;
    parent.add(mesh, grass);
  }
}

/** プレイヤーの見た目（目の付いた箱）。 */
export function playerView(color: string = palette.amber) {
  const group = new Group();
  const body = new Mesh(
    new BoxGeometry(PLAYER.width, PLAYER.height, 0.6),
    standard(color, { roughness: 0.45 })
  );
  body.position.y = PLAYER.height / 2;
  body.castShadow = true;
  const eyeMaterial = standard("#1b1f27");
  for (const dz of [-0.14, 0.14]) {
    const eye = new Mesh(new SphereGeometry(0.07, 12, 8), eyeMaterial);
    eye.position.set(0.24, 0.72, dz);
    group.add(eye);
  }
  group.add(body);
  const squash = { value: 1 };
  const update = (player: Player) => {
    group.position.set(player.position.x, player.position.y, 0);
    group.scale.x = player.facing;
    // 着地の瞬間に少しつぶす
    const sinceLand = player.time - player.landedAt;
    squash.value = sinceLand < 0.12 ? 1 - 0.18 * (1 - sinceLand / 0.12) : 1;
    body.scale.set(1 / Math.sqrt(squash.value), squash.value, 1);
    body.position.y = (PLAYER.height * squash.value) / 2;
  };
  return Object.assign(group, { update });
}

/** 簡単な自動操縦：右へ走り、穴や壁の手前で跳び、端で折り返す。 */
export function autopilot(
  player: Player,
  options: { lateJump?: number; earlyJump?: number } = {}
) {
  let pendingJump = -1;
  let held = 0;
  return (dt: number): Input => {
    let jumpPressed = false;
    if (player.position.x > 61) {
      player.facing = -1;
    } else if (player.position.x < -4) {
      player.facing = 1;
    }
    const move = player.facing;
    if (pendingJump >= 0) {
      pendingJump -= dt;
      if (pendingJump < 0) {
        jumpPressed = true;
        held = 0.35;
      }
    } else if (
      player.onGround &&
      (!player.groundAhead(0.9) || player.wallAhead(1.2))
    ) {
      // 穴の縁や壁の手前で跳ぶ（lateJump だけ遅らせて押す）
      pendingJump = options.lateJump ?? 0;
      if (pendingJump <= 0) {
        pendingJump = -1;
        jumpPressed = true;
        held = 0.35;
      }
    }
    held -= dt;
    return { move, jumpPressed, jumpHeld: held > 0 };
  };
}

/** キーボード入力（←→ / A D と スペース / ↑ / W）。 */
export function keyboard() {
  const keys = new Set<string>();
  let pressed = false;
  const down = (event: KeyboardEvent) => {
    if (
      !keys.has(event.code) &&
      ["Space", "ArrowUp", "KeyW"].includes(event.code)
    ) {
      pressed = true;
    }
    if (
      [
        "Space",
        "ArrowUp",
        "ArrowLeft",
        "ArrowRight",
        "KeyA",
        "KeyD",
        "KeyW",
      ].includes(event.code)
    ) {
      keys.add(event.code);
    }
  };
  const up = (event: KeyboardEvent) => {
    keys.delete(event.code);
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return {
    read(): Input {
      const move =
        (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) -
        (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
      const result = {
        move,
        jumpPressed: pressed,
        jumpHeld: keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW"),
      };
      pressed = false;
      return result;
    },
    active: () => keys.size > 0,
    dispose() {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    },
  };
}

/** ゲームカメラの設定：z = 14 から -Z を向く縦 40° の透視カメラ。 */
export const GAME_VIEW = {
  distance: 14,
  fov: 40,
  halfHeight: 14 * Math.tan((20 * Math.PI) / 180),
  aspect: 16 / 9,
} as const;

export function gameCamera() {
  return new PerspectiveCamera(GAME_VIEW.fov, GAME_VIEW.aspect, 0.1, 200);
}

/** ゲームカメラ（プレイヤーが実際に見る画面）の枠。 */
export function cameraFrame(parent: Group, color: string = palette.ink) {
  const frame = polyline([], color, { width: 2.5 });
  parent.add(frame);
  const set = (center: Vector2, halfWidth: number, halfHeight: number) => {
    const z = 1.05;
    frame.setPoints([
      new Vector3(center.x - halfWidth, center.y - halfHeight, z),
      new Vector3(center.x + halfWidth, center.y - halfHeight, z),
      new Vector3(center.x + halfWidth, center.y + halfHeight, z),
      new Vector3(center.x - halfWidth, center.y + halfHeight, z),
      new Vector3(center.x - halfWidth, center.y - halfHeight, z),
    ]);
  };
  return Object.assign(frame, { set });
}

/**
 * ゲームカメラの映像を画面右下の小窓に描く。
 * 観察用のカメラ（context.camera）の絵を描いたあと、小窓の範囲だけゲームカメラで描き直す。
 */
export function pictureInPicture(
  context: DemoContext,
  view: PerspectiveCamera,
  beforeInset?: (visible: boolean) => void
) {
  const { renderer, scene, camera } = context;
  const size = new Vector2();
  context.setRender(() => {
    renderer.getSize(size);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, size.x, size.y);
    beforeInset?.(false);
    renderer.render(scene, camera);
    // 左下（数値表示の上）に 16:9 の小窓を置く
    const width = Math.round(size.x * 0.3);
    const height = Math.round(width * 0.5625);
    const x = 14;
    const y = 64;
    view.aspect = width / height;
    view.updateProjectionMatrix();
    beforeInset?.(true);
    renderer.setScissorTest(true);
    renderer.setScissor(x - 2, y - 2, width + 4, height + 4);
    renderer.setViewport(x - 2, y - 2, width + 4, height + 4);
    renderer.setClearColor("#e8eef6", 1);
    renderer.clear();
    renderer.setScissor(x, y, width, height);
    renderer.setViewport(x, y, width, height);
    renderer.setClearColor("#10161f", 1);
    renderer.clear();
    renderer.render(scene, view);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, size.x, size.y);
    beforeInset?.(false);
  });
}

/** 足場と穴が交互に並ぶコース（左端から right 方向へ）。 */
export function gapCourse(
  count: number,
  platform: number,
  gap: number
): Block[] {
  const blocks: Block[] = [{ x: -8, y: -3, w: 8 + platform, h: 3 }];
  for (let i = 1; i < count; i++) {
    blocks.push({ x: i * (platform + gap), y: -3, w: platform, h: 3 });
  }
  return blocks;
}

/**
 * 右下に置く、時間の流れを横に並べた小さな図。
 * marks に「足場を離れた」「ボタンを押した」などの時刻を渡すと、縦線で描く。
 */
export function timelineHud(context: DemoContext, title: string) {
  const figure = document.createElement("figure");
  figure.className = "keyword-stage-graph";
  const caption = document.createElement("figcaption");
  caption.textContent = title;
  const canvas = document.createElement("canvas");
  canvas.width = 440;
  canvas.height = 150;
  canvas.style.width = "220px";
  canvas.style.height = "75px";
  figure.append(caption, canvas);
  context.hud(figure);
  const draw = (
    range: [number, number],
    window: [number, number] | null,
    windowColor: string,
    marks: { time: number; color: string; label: string }[]
  ) => {
    const context2d = canvas.getContext("2d");
    if (!context2d) {
      return;
    }
    const toX = (t: number) =>
      20 + ((t - range[0]) / (range[1] - range[0])) * (canvas.width - 40);
    context2d.clearRect(0, 0, canvas.width, canvas.height);
    context2d.fillStyle = "#2b3748";
    context2d.fillRect(20, 70, canvas.width - 40, 4);
    if (window) {
      context2d.fillStyle = windowColor;
      context2d.globalAlpha = 0.35;
      context2d.fillRect(
        toX(window[0]),
        40,
        toX(window[1]) - toX(window[0]),
        64
      );
      context2d.globalAlpha = 1;
    }
    context2d.font = "22px sans-serif";
    for (const [index, mark] of marks.entries()) {
      const x = toX(mark.time);
      context2d.fillStyle = mark.color;
      context2d.fillRect(x - 3, 30, 6, 84);
      context2d.fillText(
        mark.label,
        Math.min(canvas.width - 150, Math.max(4, x - 30)),
        index % 2 === 0 ? 24 : 142
      );
    }
  };
  return { draw };
}
