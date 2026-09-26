import {
  InstancedMesh,
  Matrix4,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import { palette, polyline, rng, standard } from "../../kit";
import { mannequin, walkPose } from "../../mannequin";
import type { DemoModule } from "../../types";

const FPS = 30;
const CLIP_FRAMES = 150;
const FUTURE = [10, 20, 30] as const; // 未来の軌道を見るフレーム（0.33・0.67・1 秒後）
const CYCLE_LENGTH = 1.45;

type Clip = { name: string; speed: number; turn: number; frames: Frame[] };
type Frame = {
  x: number;
  z: number;
  yaw: number;
  phase: number;
  stride: number;
  features: number[];
};

/** 速さ（m/s）と曲がる速さ（rad/s）で決まる、歩き・走り・旋回のクリップを作る（モーションキャプチャの代わり）。 */
function makeClip(name: string, speed: number, turn: number): Clip {
  const frames: Frame[] = [];
  let x = 0;
  let z = 0;
  let yaw = 0;
  let distance = 0;
  const run = speed > 1.6;
  for (let i = 0; i < CLIP_FRAMES + FUTURE[2] + 1; i++) {
    const cycle = run ? CYCLE_LENGTH * 1.5 : CYCLE_LENGTH;
    frames.push({
      x,
      z,
      yaw,
      phase: (distance / cycle) % 1,
      stride: speed < 0.05 ? 0 : Math.min(1.35, speed / 1.1),
      features: [],
    });
    x += Math.sin(yaw) * (speed / FPS);
    z += Math.cos(yaw) * (speed / FPS);
    yaw += turn / FPS;
    distance += speed / FPS;
  }
  for (let i = 0; i < CLIP_FRAMES; i++) {
    const frame = frames[i];
    if (!frame) {
      continue;
    }
    frame.features = features(
      frame,
      FUTURE.map((offset) => frames[i + offset] ?? frame),
      speed
    );
  }
  return { name, speed, turn, frames: frames.slice(0, CLIP_FRAMES) };
}

/** 照合に使う特徴：本体から見た未来の位置と向き、今の速さ、歩行の位相。 */
function features(
  current: { x: number; z: number; yaw: number; phase: number },
  future: { x: number; z: number; yaw: number }[],
  speed: number
) {
  const c = Math.cos(-current.yaw);
  const s = Math.sin(-current.yaw);
  const values: number[] = [];
  for (const point of future) {
    const dx = point.x - current.x;
    const dz = point.z - current.z;
    values.push(dx * c + dz * s, -dx * s + dz * c);
    const dyaw = point.yaw - current.yaw;
    values.push(Math.sin(dyaw) * 0.5, Math.cos(dyaw) * 0.5);
  }
  values.push(
    speed * 0.4,
    Math.sin(current.phase * Math.PI * 2) * 0.3,
    Math.cos(current.phase * Math.PI * 2) * 0.3
  );
  return values;
}

export const demo: DemoModule = {
  alt: "モーションマッチングで、プレイヤーの入力に合う動きを、たくさんのアニメーションのデータベースから毎回探して選ぶデモ。歩き・走り・左右への旋回・立ち止まりなど 13 本のクリップの全フレームについて、「この先 1 秒の移動の軌道」と「今の足の運び」を特徴として持たせておく。一定時間ごとに、入力から予測した希望の軌道（青）に最も近い特徴を持つフレームを探して、そこから再生を続ける。",
  camera: { position: [0, 7, 7.5], target: [0, 0, 0.5] },
  controls: [
    { type: "toggle", key: "auto", label: "目的地を自動で変える", value: true },
    {
      type: "select",
      key: "gait",
      label: "希望の速さ",
      value: "walk",
      options: [
        { value: "walk", label: "歩く" },
        { value: "run", label: "走る" },
      ],
    },
    {
      type: "range",
      key: "interval",
      label: "探し直す間隔",
      min: 0.05,
      max: 1,
      step: 0.05,
      value: 0.2,
      format: (value) => `${value} 秒`,
    },
    { type: "toggle", key: "trajectory", label: "軌道を表示", value: true },
  ],
  legend: [
    { color: palette.sky, label: "入力から予測した希望の軌道" },
    { color: palette.amber, label: "選んだフレームが持つ軌道" },
    { color: palette.coral, label: "目的地（地面をクリックで変更）" },
  ],
  hint: "地面をクリックすると、そこへ向かって歩きます。",
  setup(context) {
    const { scene, params } = context;
    const random = rng(7);
    const clips: Clip[] = [];
    for (const [speedName, speed] of [
      ["歩き", 1.1],
      ["走り", 2.6],
    ] as const) {
      for (const [turnName, turn] of [
        ["左へ急旋回", 1.6],
        ["左へ旋回", 0.7],
        ["直進", 0],
        ["右へ旋回", -0.7],
        ["右へ急旋回", -1.6],
      ] as const) {
        clips.push(makeClip(`${speedName}・${turnName}`, speed, turn));
      }
    }
    for (const turn of [-2, 0, 2]) {
      clips.push(
        makeClip(
          turn === 0
            ? "立ち止まり"
            : turn > 0
              ? "その場で左を向く"
              : "その場で右を向く",
          0,
          turn
        )
      );
    }
    const totalFrames = clips.reduce(
      (sum, clip) => sum + clip.frames.length,
      0
    );

    const man = mannequin({ accent: "#5aa9ff" });
    scene.add(man.root);
    const goal = new Mesh(
      new RingGeometry(0.2, 0.3, 32),
      new MeshBasicMaterial({ color: palette.coral })
    );
    goal.rotation.x = -Math.PI / 2;
    goal.position.y = 0.01;
    scene.add(goal);
    const desiredDots = new InstancedMesh(
      new SphereGeometry(0.07, 12, 8),
      standard(palette.sky, { emissive: 0.8 }),
      FUTURE.length
    );
    const matchedDots = new InstancedMesh(
      new SphereGeometry(0.07, 12, 8),
      standard(palette.amber, { emissive: 0.8 }),
      FUTURE.length
    );
    const desiredLine = polyline([], palette.sky, { width: 3 });
    const matchedLine = polyline([], palette.amber, { width: 3 });
    scene.add(desiredDots, matchedDots, desiredLine, matchedLine);

    // キャラクターの状態
    const position = new Vector3();
    let yaw = 0;
    let clipIndex = clips.length - 2;
    let frameIndex = 0;
    let frameTime = 0;
    let searchTimer = 0;
    let lastCost = 0;
    let jumps = 0;
    const velocity = new Vector2();
    const target = new Vector3(2, 0, 2);
    goal.position.set(target.x, 0.01, target.z);
    context.onPick((point) => {
      target.set(point.x, 0, point.z);
      goal.position.set(point.x, 0.01, point.z);
    });

    /** 入力（目的地への向きと希望の速さ）から、ばねのように速度が追いつく未来の軌道を予測する。 */
    const predict = (desiredSpeed: number) => {
      const toGoal = new Vector2(target.x - position.x, target.z - position.z);
      const distance = toGoal.length();
      const speed =
        distance < 0.4 ? 0 : desiredSpeed * Math.min(1, distance / 1.2);
      const desired =
        distance > 1e-3
          ? toGoal.normalize().multiplyScalar(speed)
          : new Vector2();
      const points: { x: number; z: number; yaw: number }[] = [];
      const v = velocity.clone();
      let px = position.x;
      let pz = position.z;
      let facing = yaw;
      for (let f = 1; f <= FUTURE[2]; f++) {
        v.lerp(desired, 1 - Math.exp(-4 / FPS));
        px += v.x / FPS;
        pz += v.y / FPS;
        if (v.length() > 0.2) {
          const want = Math.atan2(v.x, v.y);
          let diff = want - facing;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          facing += diff * (1 - Math.exp(-5 / FPS));
        } else if (desired.length() < 1e-3 && distance > 1e-3) {
          facing += 0;
        }
        if ((FUTURE as readonly number[]).includes(f)) {
          points.push({ x: px, z: pz, yaw: facing });
        }
      }
      velocity.lerp(desired, 1 - Math.exp(-4 / 60));
      return { points, speed };
    };

    const matrix = new Matrix4();
    return {
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        if (
          params["auto"] === true &&
          Math.hypot(target.x - position.x, target.z - position.z) < 0.5
        ) {
          target.set((random() - 0.5) * 7, 0, (random() - 0.5) * 6);
          goal.position.set(target.x, 0.01, target.z);
        }
        const desiredSpeed = params["gait"] === "run" ? 2.6 : 1.1;
        const query = predict(desiredSpeed);
        const clip = clips[clipIndex];
        const current = clip?.frames[frameIndex];
        // 一定時間ごとに、データベース全体から最もよく合うフレームを探す
        searchTimer -= dt;
        if (current && (searchTimer <= 0 || frameIndex >= CLIP_FRAMES - 2)) {
          searchTimer = Number(params["interval"]);
          const wanted = features(
            { x: position.x, z: position.z, yaw, phase: current.phase },
            query.points,
            query.speed
          );
          let best = {
            clip: clipIndex,
            frame: frameIndex,
            cost: Number.POSITIVE_INFINITY,
          };
          for (const [c, candidateClip] of clips.entries()) {
            for (const [f, frame] of candidateClip.frames.entries()) {
              if (f > CLIP_FRAMES - FUTURE[2] - 2) {
                break;
              }
              let cost = 0;
              for (let k = 0; k < wanted.length; k++) {
                const d = (wanted[k] ?? 0) - (frame.features[k] ?? 0);
                cost += d * d;
              }
              if (cost < best.cost) {
                best = { clip: c, frame: f, cost };
              }
            }
          }
          if (
            best.clip !== clipIndex ||
            Math.abs(best.frame - frameIndex) > 3
          ) {
            clipIndex = best.clip;
            frameIndex = best.frame;
            jumps++;
          }
          lastCost = best.cost;
        }
        // 選んだクリップを再生し、その移動量（ルートモーション）で本体を動かす
        frameTime += dt * FPS;
        while (frameTime >= 1) {
          frameTime -= 1;
          const playing = clips[clipIndex];
          const a = playing?.frames[frameIndex];
          const b = playing?.frames[Math.min(frameIndex + 1, CLIP_FRAMES - 1)];
          if (a && b) {
            const c = Math.cos(yaw - a.yaw);
            const s = Math.sin(yaw - a.yaw);
            const dx = b.x - a.x;
            const dz = b.z - a.z;
            position.x += dx * c + dz * s;
            position.z += -dx * s + dz * c;
            yaw += b.yaw - a.yaw;
          }
          frameIndex = Math.min(frameIndex + 1, CLIP_FRAMES - 1);
        }
        const frame = clips[clipIndex]?.frames[frameIndex];
        man.rest();
        if (frame) {
          walkPose(man, frame.phase, frame.stride);
        }
        man.root.position.copy(position);
        man.root.rotation.y = yaw;

        // 軌道の表示
        const show = params["trajectory"] === true;
        for (const item of [
          desiredDots,
          matchedDots,
          desiredLine,
          matchedLine,
        ]) {
          item.visible = show;
        }
        if (show && frame) {
          const desiredPoints = [position.clone().setY(0.05)];
          for (const [i, p] of query.points.entries()) {
            matrix.makeTranslation(p.x, 0.07, p.z);
            desiredDots.setMatrixAt(i, matrix);
            desiredPoints.push(new Vector3(p.x, 0.05, p.z));
          }
          desiredDots.instanceMatrix.needsUpdate = true;
          desiredLine.setPoints(desiredPoints);
          const playing = clips[clipIndex];
          const matchedPoints = [position.clone().setY(0.09)];
          for (const [i, offset] of FUTURE.entries()) {
            const future =
              playing?.frames[Math.min(frameIndex + offset, CLIP_FRAMES - 1)];
            if (future) {
              const c = Math.cos(yaw - frame.yaw);
              const s = Math.sin(yaw - frame.yaw);
              const dx = future.x - frame.x;
              const dz = future.z - frame.z;
              const p = new Vector3(
                position.x + dx * c + dz * s,
                0.09,
                position.z - dx * s + dz * c
              );
              matrix.makeTranslation(p.x, 0.11, p.z);
              matchedDots.setMatrixAt(i, matrix);
              matchedPoints.push(p);
            }
          }
          matchedDots.instanceMatrix.needsUpdate = true;
          matchedLine.setPoints(matchedPoints);
        }
        context.readout("再生中のクリップ", clips[clipIndex]?.name ?? "");
        context.readout(
          "データベース",
          `${clips.length} 本・${totalFrames} フレーム`
        );
        context.readout("ずれ（コスト）", lastCost.toFixed(2));
        context.readout("切り替え回数", `${jumps}`);
        context.caption(
          "入力から予測した「この先 1 秒の軌道」（青）と、今の足の運びを特徴として、データベースの全フレームと比べ、最も近いフレーム（黄の軌道）を選んで再生する。どのクリップをいつ再生するかを人が決めなくても、入力に合った動きが自動でつながる。"
        );
      },
    };
  },
};
