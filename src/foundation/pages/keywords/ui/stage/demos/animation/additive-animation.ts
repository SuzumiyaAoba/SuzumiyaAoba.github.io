import { Euler, Quaternion, Vector3 } from "three";
import type { Object3D } from "three";
import { palette } from "../../kit";
import { mannequin, walkPose } from "../../mannequin";
import type { Mannequin } from "../../mannequin";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

type Delta = { bone: (man: Mannequin) => Object3D; rotation: Euler };

/** 基本の動き（全身）。 */
function basePose(man: Mannequin, kind: string, t: number) {
  if (kind === "walk") {
    walkPose(man, (t * 0.7) % 1, 1);
  } else if (kind === "crouch") {
    man.hips.position.y -= 0.32;
    for (const side of ["L", "R"] as const) {
      man.upperLeg[side].rotation.x = -1.25;
      man.lowerLeg[side].rotation.x = 1.9;
      man.foot[side].rotation.x = -0.6;
      man.upperArm[side].rotation.x = -0.4;
      man.forearm[side].rotation.x = -0.9;
    }
    man.spine.rotation.x = 0.35;
  } else {
    man.chest.rotation.y = Math.sin(t * 0.8) * 0.04;
  }
}

/** 加算アニメーションの差分：基準の姿勢（立ち姿勢）からの回転の差だけを持つ。 */
function breathing(t: number): Delta[] {
  const b = Math.sin(t * 2.2);
  return [
    { bone: (m) => m.chest, rotation: new Euler(-0.05 * b, 0, 0) },
    { bone: (m) => m.shoulder.L, rotation: new Euler(0, 0, 0.06 * b) },
    { bone: (m) => m.shoulder.R, rotation: new Euler(0, 0, -0.06 * b) },
    { bone: (m) => m.head, rotation: new Euler(0.04 * b, 0, 0) },
  ];
}

function recoil(k: number): Delta[] {
  // 被弾：上体が後ろへのけぞり、頭がはねる（k は 1 から 0 へ減衰）
  const s = Math.sin(k * Math.PI) * k;
  return [
    { bone: (m) => m.spine, rotation: new Euler(-0.35 * s, 0.2 * s, 0) },
    { bone: (m) => m.chest, rotation: new Euler(-0.3 * s, 0, 0.1 * s) },
    { bone: (m) => m.head, rotation: new Euler(-0.5 * s, 0, 0) },
    { bone: (m) => m.upperArm.L, rotation: new Euler(-0.6 * s, 0, 0.5 * s) },
    { bone: (m) => m.upperArm.R, rotation: new Euler(-0.6 * s, 0, -0.5 * s) },
  ];
}

function fatigue(): Delta[] {
  return [
    { bone: (m) => m.spine, rotation: new Euler(0.25, 0, 0) },
    { bone: (m) => m.chest, rotation: new Euler(0.2, 0, 0) },
    { bone: (m) => m.head, rotation: new Euler(0.35, 0, 0) },
    { bone: (m) => m.shoulder.L, rotation: new Euler(0, 0, -0.12) },
    { bone: (m) => m.shoulder.R, rotation: new Euler(0, 0, 0.12) },
  ];
}

const deltaQuaternion = new Quaternion();
const identity = new Quaternion();

/** 差分を、重みを掛けて今の姿勢の上に重ねる（局所回転に右から掛ける）。 */
function applyAdditive(man: Mannequin, deltas: Delta[], weight: number) {
  if (weight <= 0) {
    return;
  }
  for (const delta of deltas) {
    deltaQuaternion.setFromEuler(delta.rotation);
    const weighted = identity
      .clone()
      .slerp(deltaQuaternion, Math.min(1, weight));
    delta.bone(man).quaternion.multiply(weighted);
  }
}

export const demo: DemoModule = {
  alt: "基本の動き（歩く・立つ・しゃがむ）の上に、呼吸・被弾の反動・疲れ・狙う向きといった「差分だけの動き」を重ねる加算アニメーションのデモ。左は基本の動きだけ、右は差分を重ねたもの。差分は立ち姿勢からの回転の差として作ってあるので、どの基本の動きにも同じように重ねられ、重みで強さを変えられる。",
  camera: { position: [0.6, 1.5, 4.6], target: [0, 1, 0] },
  controls: [
    {
      type: "select",
      key: "base",
      label: "基本の動き",
      value: "walk",
      options: [
        { value: "walk", label: "歩く" },
        { value: "idle", label: "立つ" },
        { value: "crouch", label: "しゃがむ" },
      ],
    },
    { type: "button", key: "hit", label: "被弾させる" },
    {
      type: "range",
      key: "breath",
      label: "呼吸の重み",
      min: 0,
      max: 3,
      step: 0.05,
      value: 1.5,
    },
    {
      type: "range",
      key: "fatigue",
      label: "疲れの重み",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0,
    },
    {
      type: "range",
      key: "aim",
      label: "狙う向きの重み",
      min: 0,
      max: 1,
      step: 0.05,
      value: 1,
    },
  ],
  legend: [
    { color: palette.muted, label: "基本の動きだけ" },
    { color: palette.cyan, label: "差分を重ねた動き" },
    { color: palette.amber, label: "狙う目標（ドラッグ）" },
  ],
  hint: "黄色の球をドラッグすると、右の人物が上体と頭をひねってそちらを狙います。",
  setup(context) {
    const { scene, params } = context;
    const plain = mannequin({ accent: "#7c8595" });
    plain.root.position.x = -0.9;
    const layered = mannequin({ accent: "#3fd6c6" });
    layered.root.position.x = 0.9;
    scene.add(plain.root, layered.root);
    for (const [man, text] of [
      [plain, "基本の動きだけ"],
      [layered, "差分を重ねた動き"],
    ] as const) {
      const label = context.label(text, { tone: "strong" });
      label.position.set(man.root.position.x, 2.15, 0);
      scene.add(label);
    }
    const aimTarget = handle(palette.amber, 0.08);
    aimTarget.position.set(2.2, 1.5, 1.4);
    scene.add(aimTarget);
    context.draggable(aimTarget, { normal: [0, 0, 1], origin: [0, 0, 1.4] });

    let time = 0;
    let hitTimer = 0;
    const chestWorld = new Vector3();
    return {
      action(key) {
        if (key === "hit") {
          hitTimer = 1;
        }
      },
      update({ dt }) {
        time += dt;
        hitTimer = Math.max(0, hitTimer - dt * 1.8);
        const base = String(params["base"]);
        for (const man of [plain, layered]) {
          man.rest();
          basePose(man, base, time);
        }
        // 右の人物にだけ差分を重ねる
        applyAdditive(layered, breathing(time), Number(params["breath"]));
        applyAdditive(layered, fatigue(), Number(params["fatigue"]));
        if (hitTimer > 0) {
          applyAdditive(layered, recoil(hitTimer), 1);
        }
        // 狙う向き：目標の方向と正面との角度の差を、上体と頭に分けて重ねる
        layered.root.updateMatrixWorld(true);
        layered.chest.getWorldPosition(chestWorld);
        const toTarget = aimTarget.position.clone().sub(chestWorld);
        const yaw = Math.max(
          -1.3,
          Math.min(1.3, Math.atan2(toTarget.x, toTarget.z))
        );
        const pitch = Math.max(
          -0.8,
          Math.min(
            0.8,
            -Math.atan2(toTarget.y, Math.hypot(toTarget.x, toTarget.z))
          )
        );
        applyAdditive(
          layered,
          [
            {
              bone: (m) => m.spine,
              rotation: new Euler(pitch * 0.3, yaw * 0.35, 0),
            },
            {
              bone: (m) => m.chest,
              rotation: new Euler(pitch * 0.3, yaw * 0.35, 0),
            },
            {
              bone: (m) => m.head,
              rotation: new Euler(pitch * 0.4, yaw * 0.3, 0),
            },
          ],
          Number(params["aim"])
        );
        context.readout(
          "重ねている差分",
          [
            "呼吸",
            Number(params["fatigue"]) > 0 ? "疲れ" : "",
            hitTimer > 0 ? "被弾" : "",
            Number(params["aim"]) > 0 ? "狙う向き" : "",
          ]
            .filter(Boolean)
            .join("・")
        );
        context.caption(
          "差分は「基準の姿勢から、どの骨がどれだけ回るか」だけを持つ。基本の動きの各骨の回転に、この差分を重みを掛けて掛け合わせると、歩いていても、しゃがんでいても、同じ呼吸や被弾の反動をそのまま重ねられる。1 つの反動アニメーションを全部の基本の動きのために作り分ける必要がない。"
        );
      },
    };
  },
};
