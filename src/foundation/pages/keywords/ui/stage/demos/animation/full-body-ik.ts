import { Mesh, Quaternion, SphereGeometry, Vector3 } from "three";
import { palette, polyline, standard } from "../../kit";
import { applyTwoBone, BODY, levelFoot, mannequin } from "../../mannequin";
import type { Side } from "../../mannequin";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

const ARM = BODY.upperArm + BODY.forearm;
const LEG = BODY.upperLeg + BODY.lowerLeg;
const SIDES: readonly Side[] = ["L", "R"];

export const demo: DemoModule = {
  alt: "手足 4 か所の目標に合わせて、全身の姿勢を調整するフルボディ IK のデモ。両手の目標を低い所や遠くへ動かすと、腕を伸ばすだけでは届かないので、腰を落とし、背中を曲げ、体ごと近づいて手を届かせる。その間も両足は床の目標に固定されたまま、膝の曲げ方で腰の高さを受け止める。",
  camera: { position: [2.6, 1.3, 2.2], target: [0, 0.7, 0.2] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "解き方",
      value: "full",
      options: [
        { value: "full", label: "全身（腰と背骨も動かす）" },
        { value: "limbs", label: "手足だけ（2 ボーン IK のみ）" },
      ],
    },
    {
      type: "range",
      key: "iterations",
      label: "反復回数",
      min: 1,
      max: 12,
      step: 1,
      value: 6,
    },
    { type: "toggle", key: "lines", label: "目標までの線を表示", value: true },
  ],
  legend: [
    { color: palette.amber, label: "手の目標（ドラッグ）" },
    { color: palette.sky, label: "足の目標（ドラッグ）" },
    { color: palette.coral, label: "届いていない距離" },
  ],
  hint: "黄色（手）と青（足）の球をドラッグしてください。",
  setup(context) {
    const { scene, params } = context;
    const man = mannequin();
    scene.add(man.root);
    const box = new Mesh(
      new SphereGeometry(0.12, 24, 16),
      standard("#e0a458", { roughness: 0.5 })
    );
    scene.add(box);

    const handTargets = {
      L: handle(palette.amber, 0.055),
      R: handle(palette.amber, 0.055),
    };
    handTargets.L.position.set(0.18, 0.45, 0.6);
    handTargets.R.position.set(-0.18, 0.45, 0.6);
    const footTargets = {
      L: handle(palette.sky, 0.05),
      R: handle(palette.sky, 0.05),
    };
    footTargets.L.position.set(0.14, 0.05, -0.05);
    footTargets.R.position.set(-0.14, 0.05, 0.12);
    for (const side of SIDES) {
      scene.add(handTargets[side], footTargets[side]);
      context.draggable(handTargets[side], {
        normal: [1, 0, 0],
        origin: [side === "L" ? 0.18 : -0.18, 0, 0],
      });
      context.draggable(footTargets[side], {
        normal: [0, 1, 0],
        origin: [0, 0.05, 0],
        clamp: (p) =>
          p.set(
            Math.max(-0.5, Math.min(0.5, p.x)),
            0.05,
            Math.max(-0.5, Math.min(0.6, p.z))
          ),
      });
    }
    const gaps = SIDES.map(() =>
      polyline([], palette.coral, { width: 2.5, dashed: true })
    );
    scene.add(...gaps);

    const offset = new Vector3();
    const shoulder = new Vector3();
    const hip = new Vector3();
    const pull = new Vector3();
    const lean = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const toHands = new Vector3();

    return {
      update() {
        const full = params["mode"] === "full";
        const iterations = Number(params["iterations"]);
        offset.set(0, 0, 0);
        lean.identity();
        man.rest();
        // 全身モード：腰の位置と背骨の傾きを、手が届くように少しずつ動かす
        if (full) {
          for (let iteration = 0; iteration < iterations; iteration++) {
            man.hips.position.set(0, BODY.hipHeight, 0).add(offset);
            man.spine.quaternion.copy(lean);
            man.root.updateMatrixWorld(true);
            pull.set(0, 0, 0);
            toHands.set(0, 0, 0);
            for (const side of SIDES) {
              man.upperArm[side].getWorldPosition(shoulder);
              const toTarget = handTargets[side].position.clone().sub(shoulder);
              const excess = toTarget.length() - ARM * 0.92;
              if (excess > 0) {
                pull.addScaledVector(toTarget.normalize(), excess * 0.35);
              }
              toHands.add(handTargets[side].position);
            }
            // 背骨：両手の目標の中点へ向かって、体を前に倒す（最大 80°）
            man.hips.getWorldPosition(hip);
            toHands.multiplyScalar(0.5).sub(hip).normalize();
            const bend = Math.min(
              up.angleTo(toHands) * 0.85,
              (80 * Math.PI) / 180
            );
            const axis = new Vector3().crossVectors(up, toHands);
            if (axis.lengthSq() > 1e-6) {
              lean.setFromAxisAngle(axis.normalize(), bend);
            }
            offset.add(pull);
            // 足は床から離さない：腰と足の距離が脚の長さを超えないよう、腰を足の方へ引き戻す
            for (const side of SIDES) {
              const hipPosition = new Vector3(
                (side === "L" ? 1 : -1) * BODY.hipWidth,
                BODY.hipHeight - 0.02,
                0
              ).add(offset);
              const toFoot = footTargets[side].position
                .clone()
                .add(new Vector3(0, 0.06, 0))
                .sub(hipPosition);
              const over = toFoot.length() - LEG * 0.98;
              if (over > 0) {
                offset.addScaledVector(toFoot.normalize(), over);
              }
            }
            // しゃがめる深さには限度がある（腰は 0.62 m より下げない）
            offset.y = Math.min(
              0.02,
              Math.max(offset.y, 0.62 - BODY.hipHeight)
            );
            // 倒れないよう、腰は両足の間の真上から大きく外れない（重心を支える範囲）
            const supportX =
              (footTargets.L.position.x + footTargets.R.position.x) / 2;
            const supportZ =
              (footTargets.L.position.z + footTargets.R.position.z) / 2;
            offset.x = Math.max(
              supportX - 0.12,
              Math.min(supportX + 0.12, offset.x)
            );
            // 前に体を倒すほど、釣り合いをとるため腰は足より後ろへ引く
            const back =
              Math.sin(lean.w < 1 ? 2 * Math.acos(Math.min(1, lean.w)) : 0) *
              0.22;
            offset.z = Math.max(
              supportZ - 0.25,
              Math.min(supportZ + 0.1 - back, offset.z)
            );
          }
        }
        man.hips.position.set(0, BODY.hipHeight, 0).add(offset);
        man.spine.quaternion.copy(lean);
        man.root.updateMatrixWorld(true);
        // 最後に手足をそれぞれ 2 ボーン IK で目標へ
        for (const [index, side] of SIDES.entries()) {
          man.upperArm[side].getWorldPosition(shoulder);
          const elbowPole = shoulder
            .clone()
            .add(new Vector3((side === "L" ? 1 : -1) * 0.4, -0.2, -0.6));
          const arm = applyTwoBone(
            man.upperArm[side],
            man.forearm[side],
            handTargets[side].position,
            elbowPole,
            BODY.upperArm,
            BODY.forearm
          );
          man.upperLeg[side].getWorldPosition(hip);
          const kneePole = hip
            .clone()
            .add(new Vector3((side === "L" ? 1 : -1) * 0.15, -0.2, 0.8));
          applyTwoBone(
            man.upperLeg[side],
            man.lowerLeg[side],
            footTargets[side].position.clone().add(new Vector3(0, 0.06, 0)),
            kneePole,
            BODY.upperLeg,
            BODY.lowerLeg
          );
          levelFoot(man.foot[side]);
          const gap = gaps[index];
          if (gap) {
            gap.visible =
              params["lines"] === true &&
              arm.end.distanceTo(handTargets[side].position) > 0.01;
            gap.setPoints([arm.end, handTargets[side].position.clone()]);
          }
        }
        box.position
          .copy(handTargets.L.position)
          .add(handTargets.R.position)
          .multiplyScalar(0.5);
        context.readout("腰の移動", `${(offset.length() * 100).toFixed(0)} cm`);
        context.readout(
          "背骨の傾き",
          `${((2 * Math.acos(Math.min(1, Math.abs(lean.w))) * 180) / Math.PI).toFixed(0)}°`
        );
        context.caption(
          full
            ? "手が届かない分だけ腰を目標の方へ動かし、背骨を倒す。ただし足が床から離れないよう腰と足の距離は脚の長さ以内に、倒れないよう腰は両足の真上付近に保つ。これを数回くり返してから、手足をそれぞれ 2 ボーン IK で合わせる。"
            : "手足の 2 ボーン IK だけでは、腕の長さを超えた目標には届かない（赤い点線）。腰や背骨も動かさないと、床の物を拾う姿勢にはならない。"
        );
      },
    };
  },
};
