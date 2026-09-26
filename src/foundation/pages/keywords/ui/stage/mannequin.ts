import {
  CapsuleGeometry,
  Group,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import type { Material } from "three";
import { standard } from "./kit";

/** 骨の長さ（メートル）。 */
export const BODY = {
  hipHeight: 0.94,
  hipWidth: 0.1,
  spine: 0.22,
  chest: 0.24,
  neck: 0.08,
  head: 0.12,
  shoulderWidth: 0.19,
  upperArm: 0.29,
  forearm: 0.27,
  upperLeg: 0.44,
  lowerLeg: 0.44,
  foot: 0.17,
} as const;

export type Side = "L" | "R";

export type Mannequin = {
  root: Group;
  hips: Object3D;
  spine: Object3D;
  chest: Object3D;
  neck: Object3D;
  head: Object3D;
  shoulder: Record<Side, Object3D>;
  upperArm: Record<Side, Object3D>;
  forearm: Record<Side, Object3D>;
  hand: Record<Side, Object3D>;
  upperLeg: Record<Side, Object3D>;
  lowerLeg: Record<Side, Object3D>;
  foot: Record<Side, Object3D>;
  toe: Record<Side, Object3D>;
  /** すべての骨の回転を立ち姿勢に戻す。 */
  rest: () => void;
  bones: Object3D[];
};

/** 関節（Object3D）の子として、骨に沿ったカプセルを付ける。骨は関節から局所 -Y の向きに伸びる。 */
function limb(
  parent: Object3D,
  length: number,
  radius: number,
  material: Material
) {
  const mesh = new Mesh(
    new CapsuleGeometry(radius, Math.max(0.001, length - radius * 2), 6, 12),
    material
  );
  mesh.position.y = -length / 2;
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function joint(
  parent: Object3D,
  x: number,
  y: number,
  z: number,
  name: string
) {
  const node = new Object3D();
  node.name = name;
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}

/**
 * 関節の階層を持つ人型のマネキン。root は足元（地面）にあり、キャラクターは +Z を向く。
 */
export function mannequin(
  options: { body?: string; accent?: string; joints?: string } = {}
): Mannequin {
  const body = standard(options.body ?? "#c9d2e0", { roughness: 0.55 });
  const accent = standard(options.accent ?? "#5aa9ff", { roughness: 0.5 });
  const jointMaterial = standard(options.joints ?? "#39424f", {
    roughness: 0.6,
  });
  const root = new Group();
  const hips = joint(root, 0, BODY.hipHeight, 0, "hips");
  const pelvis = new Mesh(new CapsuleGeometry(0.1, 0.12, 6, 12), accent);
  pelvis.rotation.z = Math.PI / 2;
  pelvis.castShadow = true;
  hips.add(pelvis);
  const spine = joint(hips, 0, 0.04, 0, "spine");
  const spineMesh = new Mesh(
    new CapsuleGeometry(0.1, BODY.spine - 0.1, 6, 12),
    body
  );
  spineMesh.position.y = BODY.spine / 2;
  spineMesh.castShadow = true;
  spine.add(spineMesh);
  const chest = joint(spine, 0, BODY.spine, 0, "chest");
  const chestMesh = new Mesh(new CapsuleGeometry(0.14, 0.1, 6, 12), body);
  chestMesh.position.y = BODY.chest / 2;
  chestMesh.scale.set(1.15, 1, 0.8);
  chestMesh.castShadow = true;
  chest.add(chestMesh);
  const neck = joint(chest, 0, BODY.chest, 0, "neck");
  const headJoint = joint(neck, 0, BODY.neck, 0, "head");
  const headMesh = new Mesh(new SphereGeometry(BODY.head, 24, 16), body);
  headMesh.position.y = BODY.head;
  headMesh.castShadow = true;
  headJoint.add(headMesh);
  // 顔の向きが分かるよう、目の代わりの帯を付ける
  const visor = new Mesh(new CapsuleGeometry(0.03, 0.1, 4, 8), accent);
  visor.rotation.z = Math.PI / 2;
  visor.position.set(0, BODY.head * 1.1, BODY.head * 0.88);
  headJoint.add(visor);

  const sides: Side[] = ["L", "R"];
  const buildSide = (side: Side) => {
    const s = side === "L" ? 1 : -1;
    const shoulderJoint = joint(
      chest,
      s * BODY.shoulderWidth,
      BODY.chest - 0.04,
      0,
      `shoulder${side}`
    );
    const upperArmJoint = joint(shoulderJoint, 0, 0, 0, `upperArm${side}`);
    limb(upperArmJoint, BODY.upperArm, 0.05, body);
    const forearmJoint = joint(
      upperArmJoint,
      0,
      -BODY.upperArm,
      0,
      `forearm${side}`
    );
    limb(forearmJoint, BODY.forearm, 0.042, body);
    const handJoint = joint(forearmJoint, 0, -BODY.forearm, 0, `hand${side}`);
    const palm = new Mesh(new SphereGeometry(0.05, 12, 8), jointMaterial);
    palm.position.y = -0.04;
    palm.castShadow = true;
    handJoint.add(palm);
    const upperLegJoint = joint(
      hips,
      s * BODY.hipWidth,
      -0.02,
      0,
      `upperLeg${side}`
    );
    limb(upperLegJoint, BODY.upperLeg, 0.07, body);
    const lowerLegJoint = joint(
      upperLegJoint,
      0,
      -BODY.upperLeg,
      0,
      `lowerLeg${side}`
    );
    limb(lowerLegJoint, BODY.lowerLeg, 0.055, body);
    const footJoint = joint(lowerLegJoint, 0, -BODY.lowerLeg, 0, `foot${side}`);
    const sole = new Mesh(new CapsuleGeometry(0.045, BODY.foot, 4, 10), accent);
    sole.rotation.x = Math.PI / 2;
    sole.position.set(0, -0.045, BODY.foot / 2 - 0.02);
    sole.castShadow = true;
    footJoint.add(sole);
    const toeJoint = joint(footJoint, 0, -0.06, BODY.foot, `toe${side}`);
    for (const knot of [forearmJoint, lowerLegJoint]) {
      knot.add(new Mesh(new SphereGeometry(0.052, 12, 8), jointMaterial));
    }
    return {
      shoulder: shoulderJoint,
      upperArm: upperArmJoint,
      forearm: forearmJoint,
      hand: handJoint,
      upperLeg: upperLegJoint,
      lowerLeg: lowerLegJoint,
      foot: footJoint,
      toe: toeJoint,
    };
  };
  const left = buildSide("L");
  const right = buildSide("R");
  const shoulder = { L: left.shoulder, R: right.shoulder };
  const upperArm = { L: left.upperArm, R: right.upperArm };
  const forearm = { L: left.forearm, R: right.forearm };
  const hand = { L: left.hand, R: right.hand };
  const upperLeg = { L: left.upperLeg, R: right.upperLeg };
  const lowerLeg = { L: left.lowerLeg, R: right.lowerLeg };
  const foot = { L: left.foot, R: right.foot };
  const toe = { L: left.toe, R: right.toe };
  const bones = [
    hips,
    spine,
    chest,
    neck,
    headJoint,
    ...sides.flatMap((side) => [
      shoulder[side],
      upperArm[side],
      forearm[side],
      hand[side],
      upperLeg[side],
      lowerLeg[side],
      foot[side],
    ]),
  ];
  const rest = () => {
    for (const bone of bones) {
      bone.quaternion.identity();
    }
    hips.position.set(0, BODY.hipHeight, 0);
    for (const side of sides) {
      // 腕は体の横に少し開いて下ろす
      upperArm[side].rotation.z = (side === "L" ? 1 : -1) * 0.12;
    }
  };
  rest();
  return {
    root,
    hips,
    spine,
    chest,
    neck,
    head: headJoint,
    shoulder,
    upperArm,
    forearm,
    hand,
    upperLeg,
    lowerLeg,
    foot,
    toe,
    rest,
    bones,
  };
}

/**
 * 歩行の姿勢。phase は 0〜1 で 1 歩きの周期（左足が前 → 右足が前）。
 * stride は歩幅の大きさ（0〜1.5 程度）。
 */
export function walkPose(man: Mannequin, phase: number, stride = 1) {
  const a = phase * Math.PI * 2;
  const swing = Math.sin(a) * 0.5 * stride;
  man.hips.position.y =
    BODY.hipHeight - 0.035 * stride + Math.abs(Math.cos(a)) * 0.035 * stride;
  man.hips.rotation.y = Math.sin(a) * 0.12 * stride;
  man.chest.rotation.y = -Math.sin(a) * 0.2 * stride;
  man.spine.rotation.x = 0.04 * stride;
  for (const side of ["L", "R"] as const) {
    const s = side === "L" ? 1 : -1;
    const legSwing = s * swing;
    man.upperLeg[side].rotation.x = -legSwing;
    // 足を後ろへ振り出す間に膝を曲げ、前に出しながら伸ばす
    const kneePhase = Math.sin(a * s + (s > 0 ? 0 : Math.PI) - 0.9);
    man.lowerLeg[side].rotation.x =
      Math.max(0, -kneePhase) * 0.9 * stride + 0.05;
    man.foot[side].rotation.x =
      -man.upperLeg[side].rotation.x * 0.2 -
      man.lowerLeg[side].rotation.x * 0.4;
    man.upperArm[side].rotation.x = legSwing * 0.8;
    man.upperArm[side].rotation.z = s * 0.12;
    man.forearm[side].rotation.x = -0.25 - Math.max(0, legSwing) * 0.5;
  }
}

const basis = new Matrix4();
const xAxis = new Vector3();
const yAxis = new Vector3();
const zAxis = new Vector3();
const parentRotation = new Quaternion();
const worldRotation = new Quaternion();

/**
 * 骨の向きを、局所 -Y が from → to を向き、局所 +Z が pole の側を向くように設定する。
 * 位置は変えず、回転だけを親の座標系に直して書き込む。
 */
export function aimBone(
  bone: Object3D,
  from: Vector3,
  to: Vector3,
  pole: Vector3
) {
  yAxis.subVectors(from, to).normalize(); // 骨は -Y 方向に伸びる
  zAxis.subVectors(pole, from);
  zAxis.addScaledVector(yAxis, -zAxis.dot(yAxis));
  if (zAxis.lengthSq() < 1e-8) {
    zAxis.set(0, 0, 1).addScaledVector(yAxis, -yAxis.z);
  }
  zAxis.normalize();
  xAxis.crossVectors(yAxis, zAxis).normalize();
  basis.makeBasis(xAxis, yAxis, zAxis);
  worldRotation.setFromRotationMatrix(basis);
  bone.parent?.getWorldQuaternion(parentRotation);
  bone.quaternion.copy(parentRotation.invert().multiply(worldRotation));
}

/**
 * 2 ボーン IK：付け根 root、長さ l1・l2 の 2 本の骨の先を target に届かせる中間関節（肘・膝）の位置を求める。
 * pole は関節を曲げたい側を指す点。届かない場合はまっすぐ伸ばす。
 */
export function solveTwoBone(
  root: Vector3,
  target: Vector3,
  pole: Vector3,
  l1: number,
  l2: number
) {
  const toTarget = new Vector3().subVectors(target, root);
  const distance = Math.min(toTarget.length(), (l1 + l2) * 0.9999);
  const direction = toTarget.clone().normalize();
  // 余弦定理：付け根での角度
  const cosAngle =
    (l1 * l1 + distance * distance - l2 * l2) / (2 * l1 * distance);
  const angle = Math.acos(Math.min(1, Math.max(-1, cosAngle)));
  // 曲げる向き：pole の方向から、目標方向の成分を取り除いたもの
  const bend = new Vector3().subVectors(pole, root);
  bend.addScaledVector(direction, -bend.dot(direction));
  if (bend.lengthSq() < 1e-8) {
    bend.set(0, 0, 1);
  }
  bend.normalize();
  const mid = root
    .clone()
    .addScaledVector(direction, Math.cos(angle) * l1)
    .addScaledVector(bend, Math.sin(angle) * l1);
  const end = root.clone().addScaledVector(direction, distance);
  return { mid, end, reached: toTarget.length() <= l1 + l2 };
}

/** 2 ボーン IK の結果を、上の骨と下の骨の回転として書き込む。 */
export function applyTwoBone(
  upper: Object3D,
  lower: Object3D,
  target: Vector3,
  pole: Vector3,
  l1: number,
  l2: number
) {
  upper.updateWorldMatrix(true, false);
  const root = upper.getWorldPosition(new Vector3());
  const { mid, end, reached } = solveTwoBone(root, target, pole, l1, l2);
  aimBone(upper, root, mid, pole);
  upper.updateWorldMatrix(false, false);
  aimBone(lower, mid, end, pole);
  lower.updateWorldMatrix(false, true);
  return { root, mid, end, reached };
}

const footWorld = new Quaternion();

/** 足の裏を地面と平行にし、つま先を yaw の向き（ラジアン、0 で +Z）へ向ける。 */
export function levelFoot(foot: Object3D, yaw = 0, pitch = 0) {
  foot.parent?.updateWorldMatrix(true, false);
  foot.parent?.getWorldQuaternion(parentRotation);
  footWorld.setFromAxisAngle(new Vector3(0, 1, 0), yaw);
  if (pitch !== 0) {
    footWorld.multiply(
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch)
    );
  }
  foot.quaternion.copy(parentRotation.invert().multiply(footWorld));
}
