import {
  BoxGeometry,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, rng, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const GRAVITY = 9.81;
const LINKS = 8;
const LINK_LENGTH = 0.42;
const CHAIN_ANCHOR = new Vector3(-2.2, 4.6, 0);
const SIGN_ANCHOR = new Vector3(2, 3.6, 0);
const SIGN_SIZE = new Vector3(1.6, 0.9, 0.08);

type Body = {
  mesh: Mesh | null;
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  angular: Vector3;
  previousPosition: Vector3;
  previousRotation: Quaternion;
  inverseMass: number;
  inverseInertia: Vector3; // 本体座標での慣性モーメントの逆数
};

type Joint = {
  a: Body;
  b: Body;
  localA: Vector3;
  localB: Vector3;
  /** 蝶番（ヒンジ）の軸。null なら球関節（どの向きにも回る）。 */
  axis: Vector3 | null;
  /** 角度の制限（ラジアン）。 */
  limit: number | null;
  /** 角度を測る基準の向き（それぞれの本体座標）。 */
  referenceA: Vector3;
  referenceB: Vector3;
};

const staticBody = (): Body => ({
  mesh: null,
  position: new Vector3(),
  rotation: new Quaternion(),
  velocity: new Vector3(),
  angular: new Vector3(),
  previousPosition: new Vector3(),
  previousRotation: new Quaternion(),
  inverseMass: 0,
  inverseInertia: new Vector3(),
});

function boxBody(size: Vector3, mass: number, mesh: Mesh): Body {
  const { x, y, z } = size;
  return {
    ...staticBody(),
    mesh,
    inverseMass: 1 / mass,
    inverseInertia: new Vector3(
      12 / (mass * (y * y + z * z)),
      12 / (mass * (x * x + z * z)),
      12 / (mass * (x * x + y * y))
    ),
  };
}

const makeJoint = (
  a: Body,
  b: Body,
  localA: Vector3,
  localB: Vector3,
  axis: Vector3 | null,
  limit: number | null
): Joint => ({
  a,
  b,
  localA,
  localB,
  axis,
  limit,
  referenceA: new Vector3(0, -1, 0),
  referenceB: new Vector3(0, -1, 0),
});

const temp = new Vector3();
const inverseRotation = new Quaternion();
const spin = new Quaternion();

/** 世界座標のベクトルに、慣性モーメントの逆数を掛ける。 */
function applyInverseInertia(body: Body, vector: Vector3, out: Vector3) {
  inverseRotation.copy(body.rotation).invert();
  out
    .copy(vector)
    .applyQuaternion(inverseRotation)
    .multiply(body.inverseInertia)
    .applyQuaternion(body.rotation);
  return out;
}

/** 回転ベクトル分だけクォータニオンを回す（q += ½ [v, 0] q）。 */
function rotateBy(rotation: Quaternion, vector: Vector3, scale: number) {
  spin
    .set(
      vector.x * scale * 0.5,
      vector.y * scale * 0.5,
      vector.z * scale * 0.5,
      0
    )
    .multiply(rotation);
  rotation
    .set(
      rotation.x + spin.x,
      rotation.y + spin.y,
      rotation.z + spin.z,
      rotation.w + spin.w
    )
    .normalize();
}

const r1 = new Vector3();
const r2 = new Vector3();
const p1 = new Vector3();
const p2 = new Vector3();
const n = new Vector3();
const impulse = new Vector3();
const cross1 = new Vector3();
const cross2 = new Vector3();

/** 2 つの点を重ねる位置の拘束（XPBD、コンプライアンス 0）。 */
function solvePositional(joint: Joint) {
  const { a, b } = joint;
  r1.copy(joint.localA).applyQuaternion(a.rotation);
  r2.copy(joint.localB).applyQuaternion(b.rotation);
  p1.copy(a.position).add(r1);
  p2.copy(b.position).add(r2);
  n.subVectors(p2, p1);
  const c = n.length();
  if (c < 1e-9) {
    return 0;
  }
  n.divideScalar(c);
  // 一般化された逆質量：並進のしにくさ + その点を押したときの回転のしにくさ
  cross1.crossVectors(r1, n);
  cross2.crossVectors(r2, n);
  const w1 = a.inverseMass + cross1.dot(applyInverseInertia(a, cross1, temp));
  const w2 = b.inverseMass + cross2.dot(applyInverseInertia(b, cross2, temp));
  const lambda = c / (w1 + w2);
  impulse.copy(n).multiplyScalar(lambda);
  a.position.addScaledVector(impulse, a.inverseMass);
  b.position.addScaledVector(impulse, -b.inverseMass);
  rotateBy(
    a.rotation,
    applyInverseInertia(a, cross1.crossVectors(r1, impulse), temp),
    1
  );
  rotateBy(
    b.rotation,
    applyInverseInertia(b, cross2.crossVectors(r2, impulse), temp),
    -1
  );
  return c;
}

const axisA = new Vector3();
const axisB = new Vector3();
const correction = new Vector3();

/** 角度の補正：回転ベクトル delta（向きと大きさ）だけ、2 つの物体の向きを近づける。 */
function solveAngular(a: Body, b: Body, delta: Vector3) {
  const angle = delta.length();
  if (angle < 1e-9) {
    return;
  }
  n.copy(delta).divideScalar(angle);
  const w1 = n.dot(applyInverseInertia(a, n, temp));
  const w2 = n.dot(applyInverseInertia(b, n, temp));
  correction.copy(n).multiplyScalar(angle / (w1 + w2));
  rotateBy(a.rotation, applyInverseInertia(a, correction, temp), 1);
  rotateBy(b.rotation, applyInverseInertia(b, correction, temp), -1);
}

const refA = new Vector3();
const refB = new Vector3();
const limited = new Vector3();

function solveHinge(joint: Joint, useLimit: boolean) {
  if (!joint.axis) {
    return;
  }
  const { a, b } = joint;
  // 1. 蝶番の軸をそろえる
  axisA.copy(joint.axis).applyQuaternion(a.rotation);
  axisB.copy(joint.axis).applyQuaternion(b.rotation);
  solveAngular(a, b, correction.crossVectors(axisA, axisB).clone());
  // 2. 角度の制限：軸まわりの角度が範囲を超えたら、範囲の端まで戻す
  if (!useLimit || joint.limit === null) {
    return;
  }
  axisA.copy(joint.axis).applyQuaternion(a.rotation);
  refA.copy(joint.referenceA).applyQuaternion(a.rotation);
  refB.copy(joint.referenceB).applyQuaternion(b.rotation);
  const angle = Math.atan2(
    temp.crossVectors(refA, refB).dot(axisA),
    refA.dot(refB)
  );
  if (Math.abs(angle) <= joint.limit) {
    return;
  }
  const target = Math.sign(angle) * joint.limit;
  limited.copy(refA).applyAxisAngle(axisA, target);
  solveAngular(a, b, correction.crossVectors(limited, refB).clone());
}

export const demo: DemoModule = {
  alt: "剛体をジョイント（関節）でつなぎ、拘束ソルバーで動かすデモ。左は 8 本の棒を関節でつないだ鎖で、先に重いランタンが下がっている。右は蝶番で吊った看板で、揺れる角度に制限をかけられる。毎ステップ、各関節について「つないだ点同士が離れた分」だけ、両方の物体の位置と向きを、重さと回しにくさに応じて分けて直す。",
  camera: { position: [0, 3.4, 10], target: [0, 2.5, 0] },
  controls: [
    { type: "button", key: "shake", label: "揺らす" },
    {
      type: "select",
      key: "chain",
      label: "鎖の関節",
      value: "ball",
      options: [
        { value: "ball", label: "球関節（どの向きにも曲がる）" },
        { value: "hinge", label: "蝶番（1 方向だけ曲がる）" },
      ],
    },
    {
      type: "toggle",
      key: "limit",
      label: "看板の角度を ±35° に制限",
      value: true,
    },
    {
      type: "range",
      key: "substeps",
      label: "1 フレームの分割数",
      min: 1,
      max: 40,
      step: 1,
      value: 20,
      hint: "少ないと関節が外れかけ、鎖が伸びて見えます。",
    },
    { type: "toggle", key: "show", label: "関節を表示", value: true },
  ],
  legend: [
    { color: palette.amber, label: "関節（2 つの点を重ねる拘束）" },
    { color: palette.cyan, label: "蝶番の軸" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(6);
    const world = staticBody();
    const bodies: Body[] = [];
    const joints: Joint[] = [];

    // 鎖
    const linkSize = new Vector3(0.09, LINK_LENGTH, 0.09);
    const linkMaterial = standard("#a9b3c4", {
      metalness: 0.8,
      roughness: 0.3,
    });
    const links: Body[] = [];
    for (let i = 0; i < LINKS; i++) {
      const mesh = new Mesh(
        new BoxGeometry(linkSize.x, linkSize.y, linkSize.z),
        linkMaterial
      );
      mesh.castShadow = true;
      scene.add(mesh);
      const body = boxBody(linkSize, 0.4, mesh);
      links.push(body);
      bodies.push(body);
    }
    const lanternSize = new Vector3(0.4, 0.5, 0.4);
    const lantern = boxBody(
      lanternSize,
      3,
      new Mesh(
        new BoxGeometry(lanternSize.x, lanternSize.y, lanternSize.z),
        standard("#ffcf6b", { emissive: 0.9 })
      )
    );
    if (lantern.mesh) {
      lantern.mesh.castShadow = true;
      scene.add(lantern.mesh);
    }
    bodies.push(lantern);
    const half = LINK_LENGTH / 2;
    const zAxis = new Vector3(0, 0, 1);
    const chainJoints: Joint[] = [
      makeJoint(
        world,
        links[0] ?? world,
        CHAIN_ANCHOR.clone(),
        new Vector3(0, half, 0),
        zAxis,
        null
      ),
    ];
    for (let i = 0; i < LINKS - 1; i++) {
      chainJoints.push(
        makeJoint(
          links[i] ?? world,
          links[i + 1] ?? world,
          new Vector3(0, -half, 0),
          new Vector3(0, half, 0),
          zAxis,
          null
        )
      );
    }
    chainJoints.push(
      makeJoint(
        links[LINKS - 1] ?? world,
        lantern,
        new Vector3(0, -half, 0),
        new Vector3(0, lanternSize.y / 2, 0),
        zAxis,
        null
      )
    );
    joints.push(...chainJoints);

    // 看板（上の辺の中央を蝶番で吊る）
    const signMesh = new Mesh(
      new BoxGeometry(SIGN_SIZE.x, SIGN_SIZE.y, SIGN_SIZE.z),
      standard("#b9794a", { roughness: 0.7 })
    );
    signMesh.castShadow = true;
    scene.add(signMesh);
    const sign = boxBody(SIGN_SIZE, 2, signMesh);
    bodies.push(sign);
    const signJoint = makeJoint(
      world,
      sign,
      SIGN_ANCHOR.clone(),
      new Vector3(0, SIGN_SIZE.y / 2, 0),
      new Vector3(1, 0, 0),
      (35 * Math.PI) / 180
    );
    joints.push(signJoint);
    const gallows = [
      { size: [0.12, 4.2, 0.12], position: [2.95, 2.1, 0] },
      { size: [1.2, 0.12, 0.12], position: [2.45, 3.66, 0] },
    ] as const;
    for (const part of gallows) {
      const [sx, sy, sz] = part.size;
      const [px, py, pz] = part.position;
      const mesh = new Mesh(new BoxGeometry(sx, sy, sz), standard("#5d4a38"));
      mesh.position.set(px, py, pz);
      mesh.castShadow = true;
      scene.add(mesh);
    }
    const hook = new Mesh(
      new CylinderGeometry(0.03, 0.03, 0.3, 8),
      standard("#9aa4b5", { metalness: 0.8 })
    );
    hook.position.copy(CHAIN_ANCHOR).setY(CHAIN_ANCHOR.y + 0.15);
    const beam = new Mesh(new BoxGeometry(1.4, 0.14, 0.3), standard("#4a5568"));
    beam.position.copy(CHAIN_ANCHOR).setY(CHAIN_ANCHOR.y + 0.35);
    scene.add(hook, beam);

    const jointDots = new InstancedMesh(
      new SphereGeometry(0.06, 12, 8),
      standard(palette.amber, { emissive: 1 }),
      joints.length
    );
    scene.add(jointDots);
    const axisLines = segments([], palette.cyan, { width: 2 });
    scene.add(axisLines);

    const reset = () => {
      // 鎖は横に持ち上げた状態から、看板は大きく傾けた状態から始める
      for (const [i, link] of links.entries()) {
        link.position.set(
          CHAIN_ANCHOR.x + half + i * LINK_LENGTH,
          CHAIN_ANCHOR.y,
          0
        );
        link.rotation.setFromAxisAngle(zAxis, Math.PI / 2);
        link.velocity.set(0, 0, 0);
        link.angular.set(0, 0, 0);
      }
      lantern.position.set(
        CHAIN_ANCHOR.x + LINKS * LINK_LENGTH + lanternSize.y / 2,
        CHAIN_ANCHOR.y,
        0
      );
      lantern.rotation.setFromAxisAngle(zAxis, Math.PI / 2);
      lantern.velocity.set(0, 0, 0.8);
      lantern.angular.set(0, 0, 0);
      sign.rotation.setFromAxisAngle(new Vector3(1, 0, 0), 1.2);
      sign.position
        .copy(SIGN_ANCHOR)
        .sub(new Vector3(0, SIGN_SIZE.y / 2, 0).applyQuaternion(sign.rotation));
      sign.velocity.set(0, 0, 0);
      sign.angular.set(0, 0, 0);
    };
    reset();

    const matrix = new Matrix4();
    const deltaRotation = new Quaternion();
    return {
      action(key) {
        if (key === "shake") {
          for (const body of bodies) {
            body.velocity.add(
              new Vector3(
                (random() - 0.5) * 3,
                random() * 2,
                (random() - 0.5) * 3
              )
            );
          }
          sign.angular.x += (random() - 0.5) * 12;
        }
      },
      update({ dt }) {
        const hinge = params["chain"] === "hinge";
        for (const joint of chainJoints) {
          joint.axis = hinge ? zAxis : null;
        }
        const useLimit = params["limit"] === true;
        const substeps = Number(params["substeps"]);
        let error = 0;
        if (dt > 0) {
          const h = dt / substeps;
          for (let s = 0; s < substeps; s++) {
            // 1. 拘束を無視して、速度で位置と向きを進める
            for (const body of bodies) {
              body.previousPosition.copy(body.position);
              body.previousRotation.copy(body.rotation);
              body.velocity.y -= GRAVITY * h;
              body.velocity.multiplyScalar(0.9995);
              body.position.addScaledVector(body.velocity, h);
              rotateBy(body.rotation, body.angular, h);
            }
            // 2. 各関節の拘束を満たすよう、位置と向きを直す
            error = 0;
            for (const joint of joints) {
              solveHinge(joint, useLimit);
              error = Math.max(error, solvePositional(joint));
            }
            // 3. 直した結果から速度と角速度を求め直す
            for (const body of bodies) {
              body.velocity
                .subVectors(body.position, body.previousPosition)
                .divideScalar(h);
              deltaRotation
                .copy(body.previousRotation)
                .invert()
                .premultiply(body.rotation);
              const sign_ = deltaRotation.w >= 0 ? 1 : -1;
              body.angular
                .set(deltaRotation.x, deltaRotation.y, deltaRotation.z)
                .multiplyScalar((2 * sign_) / h);
              body.angular.multiplyScalar(0.998);
            }
          }
        }
        for (const body of bodies) {
          body.mesh?.position.copy(body.position);
          body.mesh?.quaternion.copy(body.rotation);
        }
        const show = params["show"] === true;
        jointDots.visible = show;
        axisLines.visible = show;
        if (show) {
          const axisPoints: Vector3[] = [];
          for (const [i, joint] of joints.entries()) {
            p1.copy(joint.localA)
              .applyQuaternion(joint.a.rotation)
              .add(joint.a.position);
            matrix.makeTranslation(p1.x, p1.y, p1.z);
            jointDots.setMatrixAt(i, matrix);
            if (joint.axis) {
              axisA
                .copy(joint.axis)
                .applyQuaternion(joint.a.rotation)
                .multiplyScalar(0.3);
              axisPoints.push(p1.clone().sub(axisA), p1.clone().add(axisA));
            }
          }
          jointDots.instanceMatrix.needsUpdate = true;
          axisLines.setPoints(axisPoints);
        }
        refA.set(0, -1, 0);
        refB.set(0, -1, 0).applyQuaternion(sign.rotation);
        const signAngle =
          (Math.atan2(temp.crossVectors(refA, refB).x, refA.dot(refB)) * 180) /
          Math.PI;
        context.readout("関節のずれ", `${(error * 1000).toFixed(1)} mm`);
        context.readout("看板の角度", `${signAngle.toFixed(0)}°`);
        context.caption(
          hinge
            ? "蝶番の関節は、つないだ点を重ねる拘束に加えて、2 つの物体の軸をそろえる拘束を持つ。鎖は 1 つの平面の中でしか曲がらなくなる。"
            : "各関節は「2 つの物体の決まった点を重ねる」拘束。離れた分を、重さと回しにくさ（慣性）に応じて両方の物体に分けて直す。看板の蝶番は、軸をそろえる拘束と、角度の範囲を守る拘束も持つ。"
        );
      },
    };
  },
};
