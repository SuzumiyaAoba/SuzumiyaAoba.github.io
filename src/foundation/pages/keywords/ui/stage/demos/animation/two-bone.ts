import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, polyline, standard } from "../../kit";
import { applyTwoBone, BODY, mannequin } from "../../mannequin";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

export const demo: DemoModule = {
  alt: "手足の先を目標の位置へ合わせる 2 ボーン IK のデモ。肩から手までを「上腕と前腕の 2 本の骨」とみなし、三角形の 3 辺（上腕・前腕・肩から目標までの距離）から、余弦定理で肘の角度を一度に求める。黄色い球をドラッグすると右手が、青い球をドラッグすると左足が追いかける。届かない所に目標を置くと、腕はまっすぐ伸びて目標の方を指す。",
  camera: { position: [2.2, 1.6, 2.8], target: [0, 1, 0] },
  controls: [
    {
      type: "range",
      key: "pole",
      label: "肘の向き（ポールベクトル）",
      min: -180,
      max: 180,
      step: 1,
      value: -40,
      format: (value) => `${value}°`,
      hint: "腕の曲がる向きは長さだけでは決まらないので、どちらへ曲げるかを別に指定します。",
    },
    { type: "toggle", key: "reach", label: "腕が届く範囲を表示", value: true },
    { type: "toggle", key: "triangle", label: "三角形を表示", value: true },
  ],
  legend: [
    { color: palette.amber, label: "右手の目標（ドラッグ）" },
    { color: palette.sky, label: "左足の目標（ドラッグ）" },
    { color: palette.coral, label: "上腕・前腕・目標までの距離の三角形" },
  ],
  hint: "黄色と青の球をドラッグしてください。",
  setup(context) {
    const { scene, params } = context;
    const man = mannequin();
    scene.add(man.root);
    const step = new Mesh(
      new BoxGeometry(0.6, 0.25, 0.6),
      standard("#4a5568", { roughness: 0.7 })
    );
    step.position.set(0.25, 0.125, 0.45);
    step.receiveShadow = true;
    step.castShadow = true;
    scene.add(step);

    const handTarget = handle(palette.amber, 0.06);
    handTarget.position.set(-0.45, 1.35, 0.45);
    const footTarget = handle(palette.sky, 0.06);
    footTarget.position.set(0.2, 0.3, 0.4);
    scene.add(handTarget, footTarget);
    context.draggable(handTarget, { normal: [0, 0, 1], origin: [0, 0, 0.45] });
    context.draggable(footTarget, {
      normal: [0, 0, 1],
      origin: [0, 0, 0.4],
      clamp: (p) =>
        p.set(
          Math.max(-0.2, Math.min(0.7, p.x)),
          Math.max(0.05, Math.min(0.9, p.y)),
          p.z
        ),
    });

    const reachSphere = new Mesh(
      new SphereGeometry(BODY.upperArm + BODY.forearm, 32, 20),
      new MeshBasicMaterial({
        color: palette.amber,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      })
    );
    scene.add(reachSphere);
    const triangle = polyline([], palette.coral, { width: 2.5 });
    const legTriangle = polyline([], palette.coral, { width: 2.5 });
    scene.add(triangle, legTriangle);
    const shoulderWorld = new Vector3();
    const pole = new Vector3();
    const axis = new Vector3();
    const side = new Vector3();

    return {
      update() {
        man.rest();
        man.root.updateMatrixWorld(true);
        // 右腕：肩 → 手を目標へ
        man.upperArm.R.getWorldPosition(shoulderWorld);
        axis.subVectors(handTarget.position, shoulderWorld).normalize();
        // ポールベクトル：肩と目標を結ぶ軸の周りに回す（0° で肘が後ろ下を向く）
        side
          .set(0, -0.4, -1)
          .addScaledVector(axis, -new Vector3(0, -0.4, -1).dot(axis))
          .normalize();
        side.applyAxisAngle(axis, (Number(params["pole"]) * Math.PI) / 180);
        pole.copy(shoulderWorld).addScaledVector(side, 0.5);
        const arm = applyTwoBone(
          man.upperArm.R,
          man.forearm.R,
          handTarget.position,
          pole,
          BODY.upperArm,
          BODY.forearm
        );
        // 左脚：膝は前を向く
        man.upperLeg.L.updateWorldMatrix(true, false);
        const hip = man.upperLeg.L.getWorldPosition(new Vector3());
        const knee = hip.clone().add(new Vector3(0, -0.3, 0.6));
        const leg = applyTwoBone(
          man.upperLeg.L,
          man.lowerLeg.L,
          footTarget.position.clone().add(new Vector3(0, 0.06, 0)),
          knee,
          BODY.upperLeg,
          BODY.lowerLeg
        );
        man.foot.L.rotation.x = 0;

        reachSphere.position.copy(shoulderWorld);
        reachSphere.visible = params["reach"] === true;
        const showTriangle = params["triangle"] === true;
        triangle.visible = showTriangle;
        legTriangle.visible = showTriangle;
        if (showTriangle) {
          triangle.setPoints([arm.root, arm.mid, arm.end, arm.root]);
          legTriangle.setPoints([leg.root, leg.mid, leg.end, leg.root]);
        }
        const upper = arm.mid.clone().sub(arm.root);
        const lower = arm.end.clone().sub(arm.mid);
        const elbow = 180 - (upper.angleTo(lower) * 180) / Math.PI;
        context.readout("肘の角度", `${elbow.toFixed(0)}°`);
        context.readout(
          "目標までの距離",
          `${handTarget.position.distanceTo(shoulderWorld).toFixed(2)} / ${(BODY.upperArm + BODY.forearm).toFixed(2)} m`
        );
        context.caption(
          arm.reached
            ? "肩・肘・手の三角形の 3 辺の長さ（上腕、前腕、肩から目標まで）が分かれば、余弦定理で肘の角度が一度に決まる。反復がいらないので、手足の IK はほとんどこの方法で解く。"
            : "目標が届く範囲（黄色の球）の外にあるので、腕をまっすぐ伸ばして目標の方を指している。"
        );
      },
    };
  },
};
