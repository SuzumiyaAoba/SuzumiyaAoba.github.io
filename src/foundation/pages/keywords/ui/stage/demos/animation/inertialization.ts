import { Quaternion, Vector3 } from "three";
import { palette } from "../../kit";
import { mannequin, walkPose } from "../../mannequin";
import type { Mannequin } from "../../mannequin";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

type Pose = { rotations: Quaternion[]; hips: Vector3 };
type Method = "instant" | "crossfade" | "inertial";

const METHODS: readonly {
  key: Method;
  label: string;
  color: string;
  x: number;
}[] = [
  { key: "instant", label: "すぐ切り替え", color: palette.coral, x: -1.4 },
  { key: "crossfade", label: "クロスフェード", color: palette.amber, x: 0 },
  { key: "inertial", label: "慣性化ブレンド", color: palette.cyan, x: 1.4 },
];

/** 動き A：歩く。 */
function walk(man: Mannequin, t: number) {
  walkPose(man, (t * 0.75) % 1, 1.1);
}

/** 動き B：立ち止まって右手を振る。 */
function wave(man: Mannequin, t: number) {
  man.hips.position.y -= 0.02;
  man.upperArm.R.rotation.set(0, 0, -2.5);
  man.forearm.R.rotation.set(0, 0, -0.5 + Math.sin(t * 8) * 0.55);
  man.upperArm.L.rotation.set(0.1, 0, 0.25);
  man.chest.rotation.set(0, 0.2, 0.08);
  man.upperLeg.L.rotation.set(-0.1, 0, 0.08);
  man.upperLeg.R.rotation.set(0.1, 0, -0.05);
  man.head.rotation.set(0.1, -0.3, 0);
}

function capture(man: Mannequin, out?: Pose): Pose {
  const pose = out ?? {
    rotations: man.bones.map(() => new Quaternion()),
    hips: new Vector3(),
  };
  for (const [i, bone] of man.bones.entries()) {
    pose.rotations[i]?.copy(bone.quaternion);
  }
  pose.hips.copy(man.hips.position);
  return pose;
}

function apply(man: Mannequin, pose: Pose) {
  for (const [i, bone] of man.bones.entries()) {
    const rotation = pose.rotations[i];
    if (rotation) {
      bone.quaternion.copy(rotation);
    }
  }
  man.hips.position.copy(pose.hips);
}

/**
 * 慣性化の減衰曲線（Bollo, Gears of War 4）。
 * 切り替え時の差 x0 と、その変化の速さ v0 から、時間 T で速さ・加速度ともに 0 になって消える 5 次式。
 */
function inertialize(x0: number, v0Input: number, blend: number, t: number) {
  if (x0 < 1e-6) {
    return 0;
  }
  const v0 = Math.min(0, v0Input);
  const t1 = v0 < 0 ? Math.min(blend, (-5 * x0) / v0) : blend;
  if (t >= t1) {
    return 0;
  }
  const a0 = (-8 * v0 * t1 - 20 * x0) / (t1 * t1);
  const A = -(a0 * t1 * t1 + 6 * v0 * t1 + 12 * x0) / (2 * t1 ** 5);
  const B = (3 * a0 * t1 * t1 + 16 * v0 * t1 + 30 * x0) / (2 * t1 ** 4);
  const C = -(3 * a0 * t1 * t1 + 12 * v0 * t1 + 20 * x0) / (2 * t1 ** 3);
  return A * t ** 5 + B * t ** 4 + C * t ** 3 + (a0 / 2) * t * t + v0 * t + x0;
}

export const demo: DemoModule = {
  alt: "歩く動きから手を振る動きへ切り替えるときの、つなぎ方を 3 通り比べるデモ。すぐ切り替えると姿勢が一瞬で飛ぶ。クロスフェードは、しばらく両方の動きを計算して混ぜるので、なめらかだが、その間は 2 つの動きが半分ずつ混ざった不自然な姿勢になる。慣性化ブレンドは、切り替えた瞬間の姿勢の差と、その差が変化していた勢いだけを覚えておき、新しい動きの上に重ねて、自然な減速カーブで消していく。",
  camera: { position: [0, 1.6, 5.2], target: [0, 1, 0] },
  controls: [
    { type: "button", key: "switch", label: "動きを切り替える" },
    { type: "toggle", key: "auto", label: "自動で切り替える", value: true },
    {
      type: "range",
      key: "blend",
      label: "つなぐ時間",
      min: 0.1,
      max: 1,
      step: 0.05,
      value: 0.4,
      format: (value) => `${value} 秒`,
    },
  ],
  legend: METHODS.map(({ color, label }) => ({ color, label })),
  setup(context) {
    const { scene, params } = context;
    const actors = METHODS.map((method) => {
      const man = mannequin({ accent: method.color });
      man.root.position.x = method.x;
      scene.add(man.root);
      const label = context.label(method.label, { tone: "strong" });
      label.position.set(method.x, 2.2, 0);
      scene.add(label);
      return {
        ...method,
        man,
        shown: capture(man),
        previousShown: capture(man),
        offset: new Quaternion(),
        hipsOffset: new Vector3(),
      };
    });
    const graph = historyGraph(context, {
      title: "右肩の角度（切り替えの前後）",
      min: -0.2,
      max: 2.8,
      series: METHODS.map(({ color }) => ({ color })),
    });
    // 慣性化用：切り替え時の骨ごとの差（回転の軸と角度）と、その変化の速さ
    const offsets =
      actors[2]?.man.bones.map(() => ({
        axis: new Vector3(1, 0, 0),
        angle: 0,
        speed: 0,
      })) ?? [];
    const hipsOffset = { direction: new Vector3(), length: 0, speed: 0 };

    let time = 0;
    let current: "walk" | "wave" = "walk";
    let switchTime = -10;
    let autoTimer = 0;
    const scratch = mannequin();
    const from: Pose = capture(scratch);
    const to: Pose = capture(scratch);

    const evaluate = (clip: "walk" | "wave", t: number, out: Pose) => {
      scratch.rest();
      (clip === "walk" ? walk : wave)(scratch, t);
      return capture(scratch, out);
    };

    const doSwitch = () => {
      current = current === "walk" ? "wave" : "walk";
      switchTime = time;
      // 慣性化：今見えている姿勢と新しい動きの姿勢の差を記録する（新しい動きは今後これだけを計算する）
      const inertial = actors.find((actor) => actor.key === "inertial");
      if (inertial) {
        const target = evaluate(current, time, to);
        const targetBefore = evaluate(current, time - 1 / 60, from);
        for (const [i, offset] of offsets.entries()) {
          const shown = inertial.shown.rotations[i] ?? new Quaternion();
          const before =
            inertial.previousShown.rotations[i] ?? new Quaternion();
          const now = shown
            .clone()
            .multiply(
              target.rotations[i]?.clone().invert() ?? new Quaternion()
            );
          const prev = before
            .clone()
            .multiply(
              targetBefore.rotations[i]?.clone().invert() ?? new Quaternion()
            );
          const angle = 2 * Math.acos(Math.min(1, Math.abs(now.w)));
          const sign = now.w < 0 ? -1 : 1;
          offset.axis.set(now.x * sign, now.y * sign, now.z * sign);
          if (offset.axis.lengthSq() > 1e-10) {
            offset.axis.normalize();
          }
          offset.angle = angle;
          const prevAngle = 2 * Math.acos(Math.min(1, Math.abs(prev.w)));
          offset.speed = (angle - prevAngle) * 60;
        }
        const hipsNow = inertial.shown.hips.clone().sub(target.hips);
        const hipsPrev = inertial.previousShown.hips
          .clone()
          .sub(targetBefore.hips);
        hipsOffset.length = hipsNow.length();
        hipsOffset.direction.copy(hipsNow).normalize();
        hipsOffset.speed = (hipsNow.length() - hipsPrev.length()) * 60;
      }
    };

    return {
      action(key) {
        if (key === "switch") {
          doSwitch();
        }
      },
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        time += dt;
        autoTimer += dt;
        if (params["auto"] === true && autoTimer > 1.8) {
          autoTimer = 0;
          doSwitch();
        }
        const blend = Number(params["blend"]);
        const since = time - switchTime;
        const previousClip = current === "walk" ? "wave" : "walk";
        for (const actor of actors) {
          actor.previousShown = capture(actor.man, actor.previousShown);
          const target = evaluate(current, time, to);
          if (actor.key === "instant" || since >= blend) {
            apply(actor.man, target);
          }
          if (actor.key === "crossfade" && since < blend) {
            // クロスフェード：古い動きも計算し続け、重みを変えながら混ぜる
            const old = evaluate(previousClip, time, from);
            const w = since / blend;
            for (const [i, bone] of actor.man.bones.entries()) {
              bone.quaternion
                .copy(old.rotations[i] ?? bone.quaternion)
                .slerp(target.rotations[i] ?? bone.quaternion, w);
            }
            actor.man.hips.position.copy(old.hips).lerp(target.hips, w);
          }
          if (actor.key === "inertial" && since < blend) {
            // 慣性化：新しい動きの姿勢に、切り替え時の差を減衰させながら重ねる
            apply(actor.man, target);
            for (const [i, bone] of actor.man.bones.entries()) {
              const offset = offsets[i];
              if (offset) {
                const angle = inertialize(
                  offset.angle,
                  offset.speed,
                  blend,
                  since
                );
                bone.quaternion.premultiply(
                  new Quaternion().setFromAxisAngle(offset.axis, angle)
                );
              }
            }
            actor.man.hips.position.addScaledVector(
              hipsOffset.direction,
              inertialize(hipsOffset.length, hipsOffset.speed, blend, since)
            );
          }
          actor.shown = capture(actor.man, actor.shown);
        }
        graph.push(
          actors.map(
            (actor) =>
              -actor.man.upperArm.R.rotation.z +
              actor.man.upperArm.R.rotation.x * 0.3
          )
        );
        context.readout(
          "再生中の動き",
          current === "walk" ? "歩く" : "手を振る"
        );
        context.readout(
          "切り替えからの時間",
          since < 5 ? `${since.toFixed(2)} 秒` : "―"
        );
        context.caption(
          "クロスフェードは、つなぐ間ずっと古い動きと新しい動きの両方を計算して混ぜる。慣性化ブレンドは、切り替えた瞬間の「見えている姿勢」と「新しい動きの姿勢」の差だけを覚え、その差を減速しながら消すので、計算するのは新しい動き 1 つだけで、切り替え直後から新しい動きの勢いが出る。"
        );
      },
    };
  },
};
