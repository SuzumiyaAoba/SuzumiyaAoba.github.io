import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, polyline, rng, standard } from "../../kit";
import { mannequin } from "../../mannequin";
import type { Mannequin } from "../../mannequin";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

const CLIP = 1.6;
const PAUSE = 0.9;
const WARP_START = 0.35;
const WARP_END = 0.85;
const AUTHORED = 1.5; // アニメーションに焼き込まれた前進距離

const smooth = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** 突きのアニメーションが想定する前進量（本体の局所 +Z 方向）。 */
const authored = (t: number) =>
  0.1 * smooth(0, WARP_START, t) +
  (AUTHORED - 0.1) * smooth(WARP_START, WARP_END, t);

/** 突きの姿勢：構え → 踏み込んで右の拳を突き出す → 戻る。 */
function strikePose(man: Mannequin, t: number) {
  const windUp = smooth(0, WARP_START, t) * (1 - smooth(WARP_START, 0.6, t));
  const lunge = smooth(WARP_START, WARP_END, t) * (1 - smooth(1.15, CLIP, t));
  man.hips.position.y -= 0.08 * windUp + 0.14 * lunge;
  man.spine.rotation.x = 0.1 * windUp + 0.25 * lunge;
  man.chest.rotation.y = 0.5 * windUp - 0.45 * lunge;
  man.upperLeg.L.rotation.x = -0.25 * windUp - 0.95 * lunge;
  man.lowerLeg.L.rotation.x = 0.3 * windUp + 0.75 * lunge;
  man.upperLeg.R.rotation.x = 0.15 * windUp + 0.55 * lunge;
  man.lowerLeg.R.rotation.x = 0.2 * windUp + 0.35 * lunge;
  man.foot.L.rotation.x = 0.2 * lunge;
  man.upperArm.R.rotation.x = 0.6 * windUp - 1.55 * lunge;
  man.forearm.R.rotation.x = -1.6 * windUp - 0.05 * lunge;
  man.upperArm.L.rotation.x = -0.8 * windUp + 0.5 * lunge;
  man.forearm.L.rotation.x = -1.4;
}

export const demo: DemoModule = {
  alt: "踏み込んで突く攻撃のアニメーションを、離れた位置や斜めにいる相手に当てるモーションワーピングのデモ。アニメーションには決まった距離（1.5 m）だけ前へ進む動きが入っているので、そのまま再生すると、相手が近ければ行き過ぎ、遠ければ届かない。モーションワーピングは、踏み込みの区間だけ移動の量と向きを伸び縮みさせ、突きの瞬間にちょうど相手の前に着くようにする。",
  camera: { position: [4.6, 2.4, 1.4], target: [0, 0.8, 1.3] },
  controls: [
    { type: "toggle", key: "warp", label: "モーションワーピング", value: true },
    { type: "button", key: "random", label: "相手をランダムな位置に置く" },
    {
      type: "toggle",
      key: "ghost",
      label: "ワープしない場合の着地点を表示",
      value: true,
    },
  ],
  legend: [
    { color: palette.coral, label: "相手（ドラッグ）" },
    { color: palette.sky, label: "本体の移動の軌跡" },
    { color: palette.ink, label: "ワープしない場合の着地点" },
  ],
  hint: "赤い相手をドラッグして、近くや遠く、斜めに置いてみてください。",
  setup(context) {
    const { scene, params } = context;
    const random = rng(4);
    const man = mannequin({ accent: "#f2a65a" });
    scene.add(man.root);

    const dummy = new Group();
    const post = new Mesh(
      new CylinderGeometry(0.16, 0.2, 1.4, 20),
      standard("#b04a45", { roughness: 0.7 })
    );
    post.position.y = 0.7;
    const head = new Mesh(
      new SphereGeometry(0.15, 20, 14),
      standard("#d0615b", { roughness: 0.6 })
    );
    head.position.y = 1.55;
    dummy.add(post, head);
    for (const mesh of [post, head]) {
      mesh.castShadow = true;
    }
    const grip = handle(palette.coral, 0.12);
    grip.position.set(0.9, 0.05, 2.3);
    scene.add(dummy, grip);
    context.draggable(grip, {
      normal: [0, 1, 0],
      origin: [0, 0.05, 0],
      clamp: (p) => {
        p.y = 0.05;
        const d = Math.hypot(p.x, p.z);
        if (d < 1) {
          p.multiplyScalar(1 / Math.max(d, 1e-3));
        }
        return p.set(
          Math.max(-2.5, Math.min(2.5, p.x)),
          0.05,
          Math.max(-1, Math.min(3.5, p.z))
        );
      },
    });
    const ghost = new Mesh(
      new CylinderGeometry(0.28, 0.28, 0.02, 32),
      new MeshBasicMaterial({
        color: palette.ink,
        transparent: true,
        opacity: 0.35,
      })
    );
    scene.add(ghost);
    const path = polyline([], palette.sky, { width: 3 });
    scene.add(path);
    const spark = new Mesh(
      new SphereGeometry(0.12, 16, 12),
      standard("#ffe28a", { emissive: 3 })
    );
    spark.visible = false;
    scene.add(spark);

    // 突きの瞬間の拳の位置を、本体から見た位置として測っておく（ワープの行き先の計算に使う）
    man.rest();
    strikePose(man, WARP_END);
    man.root.updateMatrixWorld(true);
    const fistOffset = man.hand.R.getWorldPosition(new Vector3()).setY(0);
    let time = 0;
    const start = new Vector3();
    let warpFrom = new Vector3();
    let warpTo = new Vector3();
    let yawFrom = 0;
    let yawTo = 0;
    let hitDistance = 0;
    let warpUsed = true;
    const pathPoints: Vector3[] = [];
    const fist = new Vector3();

    return {
      action(key) {
        if (key === "random") {
          const angle = (random() - 0.5) * 1.6;
          const distance = 1.3 + random() * 1.8;
          grip.position.set(
            Math.sin(angle) * distance,
            0.05,
            Math.cos(angle) * distance
          );
        }
      },
      update({ dt }) {
        dummy.position.set(grip.position.x, 0, grip.position.z);
        time += dt;
        if (time > CLIP + PAUSE) {
          time = 0;
          pathPoints.length = 0;
        }
        const t = Math.min(time, CLIP);
        if (time === dt || pathPoints.length === 0) {
          warpUsed = params["warp"] === true;
        }
        // 踏み込みの直前に、ワープの行き先（相手の手前）と向きを決める
        if (t < WARP_START) {
          warpFrom = start.clone().add(new Vector3(0, 0, authored(t)));
          yawFrom = 0;
          // 拳が相手の表面（半径 0.18）に届くように、本体の着くべき位置と向きを逆算する
          const toTarget = dummy.position.clone().sub(warpFrom);
          const lateral = Math.asin(
            Math.max(
              -1,
              Math.min(1, fistOffset.x / Math.max(toTarget.length(), 0.5))
            )
          );
          yawTo = Math.atan2(toTarget.x, toTarget.z) + lateral;
          const reach = fistOffset
            .clone()
            .setZ(fistOffset.z + 0.12)
            .applyAxisAngle(new Vector3(0, 1, 0), yawTo);
          warpTo = dummy.position.clone().sub(reach);
        }
        let position: Vector3;
        let yaw: number;
        const progress =
          (authored(t) - authored(WARP_START)) /
          (authored(WARP_END) - authored(WARP_START));
        if (t < WARP_START) {
          position = warpFrom.clone();
          yaw = 0;
        } else if (warpUsed) {
          // ワープ：アニメーションの進み具合（progress）に合わせて、行き先への移動と向きの回転を配分する
          const p = Math.min(1, progress);
          position = warpFrom.clone().lerp(warpTo, p);
          yaw = yawFrom + (yawTo - yawFrom) * Math.min(1, p * 1.6);
        } else {
          position = warpFrom
            .clone()
            .add(new Vector3(0, 0, authored(t) - authored(WARP_START)));
          yaw = 0;
        }
        man.rest();
        strikePose(man, t);
        man.root.position.copy(position);
        man.root.rotation.y = yaw;
        man.root.updateMatrixWorld(true);
        pathPoints.push(position.clone().setY(0.02));
        path.setPoints(pathPoints);
        // 突きの瞬間に、拳と相手の距離を測る
        man.hand.R.getWorldPosition(fist);
        const target = dummy.position.clone().setY(1.25);
        if (t < WARP_START) {
          hitDistance = Number.POSITIVE_INFINITY;
        } else if (t < WARP_END + 0.2) {
          hitDistance = Math.min(
            hitDistance,
            Math.hypot(fist.x - target.x, fist.z - target.z) - 0.18
          );
        }
        spark.visible =
          t > WARP_END - 0.05 && t < WARP_END + 0.25 && hitDistance < 0.12;
        spark.position.copy(fist);
        ghost.visible = params["ghost"] === true;
        ghost.position.set(0, 0.012, authored(CLIP) + 0.001);
        context.readout(
          "突きの結果",
          Number.isFinite(hitDistance)
            ? hitDistance < 0.12
              ? "命中"
              : `${(hitDistance * 100).toFixed(0)} cm 外れ`
            : "―"
        );
        context.readout(
          "移動の伸び縮み",
          `${((warpTo.distanceTo(warpFrom) / (authored(WARP_END) - authored(WARP_START))) * 100).toFixed(0)}%`
        );
        context.caption(
          warpUsed
            ? "踏み込みが始まる直前に、相手の手前の「着くべき位置」と「向くべき向き」を決め、踏み込みの区間だけ、アニメーションの前進量をその位置へ向かうように伸び縮みさせ、向きも回す。手足の動きはそのままなので、どの距離の相手にも自然に突きが当たる。"
            : "アニメーションの前進量のまま動くので、いつも同じ 1.5 m だけ踏み込む。相手が近いと突き抜け、遠いと届かず、斜めにいると横を突いてしまう。"
        );
      },
    };
  },
};
