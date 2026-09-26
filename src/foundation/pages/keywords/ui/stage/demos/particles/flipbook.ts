import {
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  Vector3,
} from "three";
import { palette, rng, segments } from "../../kit";
import { explosionAtlas, particleSystem } from "../../particles";
import type { DemoModule } from "../../types";

const GRID = 4;
const FRAMES = GRID * GRID;
const MAX = 12;
const BOARD = 3;
const BOARD_POSITION = new Vector3(-3.4, 2.1, -1.6);

export const demo: DemoModule = {
  alt: "床のあちこちで爆発が起きるデモ。爆発は 1 枚の板で、あらかじめ描いた 16 コマの連番画像を寿命に合わせて切り替えている。左奥のパネルには元の画像と、いま表示しているコマが枠で示される。",
  camera: { position: [1.2, 3, 7.4], target: [-0.6, 1.4, -0.4] },
  bloom: { strength: 0.9, radius: 0.5, threshold: 0.6 },
  studio: { background: "#07090e" },
  controls: [
    {
      type: "range",
      key: "fps",
      label: "再生コマ数",
      min: 4,
      max: 60,
      step: 1,
      value: 16,
      format: (value) => `${value} コマ/秒`,
    },
    {
      type: "toggle",
      key: "blend",
      label: "コマ間をクロスフェード",
      value: false,
      hint: "低いコマ数でも、前後のコマを混ぜるとカクつきが和らぎます。",
    },
    {
      type: "toggle",
      key: "atlas",
      label: "元の画像（アトラス）を表示",
      value: true,
    },
  ],
  legend: [{ color: palette.cyan, label: "表示中のコマ" }],
  setup(context) {
    const { scene, params } = context;
    const random = rng(6);
    const atlas = explosionAtlas();
    const explosions = particleSystem({
      capacity: MAX,
      texture: atlas,
      additive: false,
      mode: "billboard",
      frames: [GRID, GRID],
    });
    scene.add(explosions);
    const board = new Mesh(
      new PlaneGeometry(BOARD, BOARD),
      new MeshBasicMaterial({ map: atlas, transparent: true })
    );
    const boardBack = new Mesh(
      new PlaneGeometry(BOARD + 0.2, BOARD + 0.2),
      new MeshBasicMaterial({ color: "#121a26" })
    );
    board.position.copy(BOARD_POSITION);
    boardBack.position.copy(BOARD_POSITION).add(new Vector3(0, 0, -0.01));
    const frameOutline = segments([], palette.cyan, { width: 2.5 });
    scene.add(boardBack, board, frameOutline);
    const boardLabel = context.label("16 コマのアトラス", { tone: "muted" });
    boardLabel.position
      .copy(BOARD_POSITION)
      .add(new Vector3(0, BOARD / 2 + 0.25, 0));
    scene.add(boardLabel);
    const flash = new PointLight("#ff8a3a", 0, 6, 1.5);
    scene.add(flash);

    const ages = new Float32Array(MAX).fill(99);
    const centers = Array.from({ length: MAX }, () => new Vector3());
    const scales = new Float32Array(MAX);
    let cursor = 0;
    let timer = 0;
    let tracked = 0;

    return {
      update({ dt }) {
        const fps = Number(params["fps"]);
        const duration = FRAMES / fps;
        timer += dt;
        if (timer > Math.max(0.35, duration / 3)) {
          timer = 0;
          ages[cursor] = 0;
          centers[cursor]?.set(
            (random() - 0.3) * 5,
            0.9 + random() * 0.4,
            (random() - 0.5) * 3
          );
          scales[cursor] = 1.6 + random() * 1.2;
          tracked = cursor;
          cursor = (cursor + 1) % MAX;
        }
        let flashLevel = 0;
        for (let index = 0; index < MAX; index++) {
          const age = (ages[index] ?? 99) + dt;
          ages[index] = age;
          const center = centers[index];
          const alive = age < duration && center !== undefined;
          const frame = Math.min(FRAMES - 1.001, age * fps);
          explosions.positions.set(
            alive ? [center.x, center.y + age * 0.35, center.z] : [0, -100, 0],
            index * 3
          );
          explosions.sizes[index] = alive
            ? (scales[index] ?? 2) * (0.6 + Math.min(1, age * 3) * 0.6)
            : 0;
          explosions.frames[index] = frame;
          explosions.rotations[index] = index * 1.7;
          const glow = Math.max(0, 1 - frame / 7);
          explosions.colors.set(
            [1.1 + glow * 2.6, 1 + glow * 1.5, 0.9 + glow * 0.6, 1],
            index * 4
          );
          if (alive && glow > flashLevel) {
            flashLevel = glow;
            flash.position.copy(center);
          }
        }
        flash.intensity = flashLevel * 25;
        explosions.setFrameBlend(params["blend"] === true);
        explosions.setCount(MAX);
        explosions.commit();

        const showAtlas = params["atlas"] === true;
        board.visible = showAtlas;
        boardBack.visible = showAtlas;
        boardLabel.visible = showAtlas;
        const trackedAge = ages[tracked] ?? 99;
        const current = Math.floor(Math.min(FRAMES - 1, trackedAge * fps));
        frameOutline.visible = showAtlas && trackedAge < duration;
        const cell = BOARD / GRID;
        const left = BOARD_POSITION.x - BOARD / 2 + (current % GRID) * cell;
        const top =
          BOARD_POSITION.y + BOARD / 2 - Math.floor(current / GRID) * cell;
        const z = BOARD_POSITION.z + 0.01;
        frameOutline.setPoints([
          new Vector3(left, top, z),
          new Vector3(left + cell, top, z),
          new Vector3(left + cell, top, z),
          new Vector3(left + cell, top - cell, z),
          new Vector3(left + cell, top - cell, z),
          new Vector3(left, top - cell, z),
          new Vector3(left, top - cell, z),
          new Vector3(left, top, z),
        ]);
        context.readout("表示中のコマ", `${current + 1} / ${FRAMES}`);
        context.readout("1 回の爆発の長さ", `${duration.toFixed(2)} 秒`);
        context.caption(
          "1 枚のテクスチャに並べたコマのうち、どこを表示するかを UV で切り替える。三角形 2 枚で、形が変化する爆発になる。"
        );
      },
    };
  },
};
