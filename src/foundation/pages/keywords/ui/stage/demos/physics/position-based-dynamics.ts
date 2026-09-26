import {
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
} from "three";
import { palette, segments } from "../../kit";
import { clothGeometry, ParticleSystem } from "../../pbd";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

const COLUMNS = 26;
const ROWS = 22;
const WIDTH = 4;
const HEIGHT = 3.4;
const TOP = 4.4;
const BALL_RADIUS = 0.7;
const STRETCH = 0;
const SHEAR = 1;
const BEND = 2;

function bannerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context2d = canvas.getContext("2d");
  if (context2d) {
    context2d.fillStyle = "#7a2433";
    context2d.fillRect(0, 0, 256, 256);
    context2d.fillStyle = "#d9a441";
    for (let index = 0; index < 4; index++) {
      context2d.fillRect(0, 18 + index * 6, 256, 3);
      context2d.fillRect(0, 214 + index * 6, 256, 3);
    }
    context2d.beginPath();
    context2d.arc(128, 124, 52, 0, Math.PI * 2);
    context2d.lineWidth = 10;
    context2d.strokeStyle = "#d9a441";
    context2d.stroke();
    context2d.beginPath();
    context2d.moveTo(128, 84);
    context2d.lineTo(160, 150);
    context2d.lineTo(96, 150);
    context2d.closePath();
    context2d.fillStyle = "#e8d3a0";
    context2d.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export const demo: DemoModule = {
  alt: "竿から吊るした旗の布を、位置ベース物理（PBD）で動かすデモ。布は格子状に並んだ点で、隣同士の距離を保つ拘束でつながっている。毎ステップ、まず重力や風で点を動かしてから、拘束を満たすように点の位置を直接直し、直した位置の変化から速度を求める。球をドラッグして布に押し当てると、布がまとわりつき、押しのけられる。",
  camera: { position: [4.2, 3.4, 7.5], target: [0, 2.6, 0] },
  controls: [
    {
      type: "range",
      key: "iterations",
      label: "拘束の反復回数",
      min: 1,
      max: 30,
      step: 1,
      value: 10,
      hint: "少ないと布がゴムのように伸びます。",
    },
    {
      type: "range",
      key: "stiffness",
      label: "硬さ（1 回の補正の割合）",
      min: 0.05,
      max: 1,
      step: 0.01,
      value: 1,
    },
    { type: "toggle", key: "bend", label: "曲げの拘束", value: true },
    { type: "toggle", key: "wind", label: "風", value: true },
    {
      type: "select",
      key: "pins",
      label: "固定する点",
      value: "top",
      options: [
        { value: "top", label: "上の辺すべて" },
        { value: "corners", label: "上の両端だけ" },
      ],
    },
    { type: "toggle", key: "mesh", label: "点と拘束を表示", value: false },
  ],
  legend: [
    { color: palette.amber, label: "伸びの拘束" },
    { color: palette.sky, label: "せん断（斜め）の拘束" },
    { color: palette.coral, label: "ドラッグできる球" },
  ],
  hint: "赤い球をドラッグして布に押し当てられます。",
  setup(context) {
    const { scene, params } = context;
    const system = new ParticleSystem(COLUMNS * ROWS);
    const index = (i: number, j: number) => j * COLUMNS + i;
    const position = new Vector3();
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLUMNS; i++) {
        system.set(
          index(i, j),
          position.set(
            (i / (COLUMNS - 1) - 0.5) * WIDTH,
            TOP - (j / (ROWS - 1)) * HEIGHT,
            0
          )
        );
      }
    }
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLUMNS; i++) {
        if (i < COLUMNS - 1) {
          system.connect(index(i, j), index(i + 1, j), 0, STRETCH);
        }
        if (j < ROWS - 1) {
          system.connect(index(i, j), index(i, j + 1), 0, STRETCH);
        }
        if (i < COLUMNS - 1 && j < ROWS - 1) {
          system.connect(index(i, j), index(i + 1, j + 1), 0, SHEAR);
          system.connect(index(i + 1, j), index(i, j + 1), 0, SHEAR);
        }
        // 1 つ飛ばしの点をつなぐと、折れ曲がりにくくなる（簡易的な曲げの拘束）
        if (i < COLUMNS - 2) {
          system.connect(index(i, j), index(i + 2, j), 0, BEND);
        }
        if (j < ROWS - 2) {
          system.connect(index(i, j), index(i, j + 2), 0, BEND);
        }
      }
    }
    const pin = (mode: string) => {
      for (let i = 0; i < COLUMNS; i++) {
        const pinned = mode === "top" || i === 0 || i === COLUMNS - 1;
        system.inverseMass[index(i, 0)] = pinned ? 0 : 1;
      }
    };
    let pinMode = "top";
    pin(pinMode);

    const geometry = context.track(clothGeometry(COLUMNS, ROWS));
    const cloth = new Mesh(
      geometry,
      new MeshStandardMaterial({
        map: context.track(bannerTexture()),
        side: DoubleSide,
        roughness: 0.85,
      })
    );
    cloth.castShadow = true;
    cloth.receiveShadow = true;
    scene.add(cloth);
    const rod = new Mesh(
      new CylinderGeometry(0.06, 0.06, WIDTH + 0.8, 16),
      new MeshStandardMaterial({ color: "#8a6a4a", roughness: 0.6 })
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, TOP + 0.05, 0);
    rod.castShadow = true;
    scene.add(rod);
    const stretchLines = segments([], palette.amber, { width: 1 });
    const shearLines = segments([], palette.sky, { width: 1, opacity: 0.6 });
    scene.add(stretchLines, shearLines);

    const ball = handle(palette.coral, BALL_RADIUS);
    ball.position.set(3, 1.4, 0.9);
    scene.add(ball);
    context.draggable(ball, {
      normal: [0, 0, 1],
      origin: [0, 0, 0.9],
      clamp: (p) =>
        p.set(
          Math.max(-4, Math.min(4, p.x)),
          Math.max(BALL_RADIUS, Math.min(5, p.y)),
          p.z
        ),
    });

    let time = 0;
    const wind = (i: number, out: Vector3) => {
      // 旗をはためかせる風：時間と場所で強さが揺れる
      const x = system.positions[i * 3] ?? 0;
      const gust =
        0.6 + 0.4 * Math.sin(time * 1.3 + x * 0.8) * Math.sin(time * 2.1);
      out.set(1.2, 0, 5.5 * gust + Math.sin(time * 7 + i * 0.37) * 1.2);
    };

    return {
      update({ dt }) {
        const mode = String(params["pins"]);
        if (mode !== pinMode) {
          pinMode = mode;
          pin(mode);
        }
        const iterations = Number(params["iterations"]);
        const stiffness = Number(params["stiffness"]);
        const bend = params["bend"] === true;
        const windOn = params["wind"] === true;
        const substeps = 2;
        if (dt > 0) {
          const h = dt / substeps;
          for (let s = 0; s < substeps; s++) {
            time += h;
            // 1. 予測：力で速度を変え、仮の位置へ動かす
            system.predict(h, 9.81, 0.002, windOn ? wind : undefined);
            // 2. 補正：拘束（距離・衝突）を満たすよう位置を直接直す
            for (let iteration = 0; iteration < iterations; iteration++) {
              system.solveDistances(
                h,
                "pbd",
                stiffness,
                (constraint) => bend || constraint.kind !== BEND
              );
              system.collideSphere(ball.position, BALL_RADIUS + 0.04);
              system.collideFloor(0.02);
            }
            // 3. 速度の更新：位置の変化 ÷ 時間
            system.updateVelocities(h);
          }
        }
        geometry.update(system.positions);

        const showMesh = params["mesh"] === true;
        stretchLines.visible = showMesh;
        shearLines.visible = showMesh;
        if (showMesh) {
          const a = new Vector3();
          const b = new Vector3();
          const stretchPoints: Vector3[] = [];
          const shearPoints: Vector3[] = [];
          for (const constraint of system.constraints) {
            if (constraint.kind === BEND) {
              continue;
            }
            system.get(constraint.a, a);
            system.get(constraint.b, b);
            (constraint.kind === STRETCH ? stretchPoints : shearPoints).push(
              a.clone().setZ(a.z + 0.01),
              b.clone().setZ(b.z + 0.01)
            );
          }
          stretchLines.setPoints(stretchPoints);
          shearLines.setPoints(shearPoints);
        }
        context.readout("点の数", `${system.count}`);
        context.readout("拘束の数", `${system.constraints.length}`);
        context.readout(
          "最大の伸び",
          `${(system.maxStretch(STRETCH) * 100).toFixed(1)}%`
        );
        context.caption(
          "毎ステップ、①重力と風で点を仮の位置へ動かし、②隣との距離が元に戻るよう位置を直接直すことをくり返し、③直したあとの位置の変化から速度を求める。力ではなく位置を直すので、反復が少なくても発散せず、衝突もめり込みを押し戻すだけで済む。"
        );
      },
    };
  },
};
