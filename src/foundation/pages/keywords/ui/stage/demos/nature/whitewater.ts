import { Color } from "three";
import { palette, pointCloud, rng } from "../../kit";
import type { DemoModule } from "../../types";
import {
  gerstnerPoint,
  oceanSurface,
  waterHeight,
  waveSet,
  waveUniforms,
} from "../../waves";

const CAPACITY = 7000;
const AREA = 13;
const GRAVITY = 9.81;
const SPRAY = 0;
const FOAM = 1;
const BUBBLE = 2;

export const demo: DemoModule = {
  alt: "荒れた海の波頭から生まれる白い水（ホワイトウォーター）を、粒子で表すデモ。波が尖って崩れかけた場所から粒子を生み、水面より上にあるものは飛沫として放物線を描いて落ち、水面にあるものは泡として波に乗って漂い、水中にあるものは気泡として浮かび上がる。同じ粒子が、水面との位置関係によって飛沫・泡・気泡と役割を変えていく。",
  camera: { position: [15, 7, 17], target: [0, 0, 0] },
  studio: { floor: false, background: "#0d1822" },
  controls: [
    {
      type: "range",
      key: "steepness",
      label: "波の尖り（風の強さ）",
      min: 0.3,
      max: 1.4,
      step: 0.01,
      value: 1.15,
      hint: "尖るほど波頭が崩れやすくなり、白い水が増えます。",
    },
    {
      type: "range",
      key: "threshold",
      label: "崩れたと見なす尖り",
      min: 0.05,
      max: 0.6,
      step: 0.01,
      value: 0.3,
      hint: "水面の伸び縮み（ヤコビアン）がこの値より小さい所から粒子を生みます。",
    },
    {
      type: "select",
      key: "color",
      label: "粒子の色",
      value: "type",
      options: [
        { value: "type", label: "種類で色分け" },
        { value: "white", label: "すべて白（見た目）" },
      ],
    },
    { type: "toggle", key: "ocean", label: "水面を表示", value: true },
  ],
  legend: [
    { color: palette.ink, label: "飛沫（空中）" },
    { color: palette.sky, label: "泡（水面）" },
    { color: palette.violet, label: "気泡（水中）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(21);
    const state = waveUniforms(
      waveSet({ seed: 5, wavelength: 7, amplitude: 0.45, spread: 0.5 })
    );
    state.uWaveCount.value = 5;
    const ocean = oceanSurface(state, { size: 80, segments: 360, foam: true });
    scene.add(ocean);
    const cloud = pointCloud(CAPACITY, { size: 16 });
    scene.add(cloud);

    const px = new Float32Array(CAPACITY);
    const py = new Float32Array(CAPACITY);
    const pz = new Float32Array(CAPACITY);
    const vx = new Float32Array(CAPACITY);
    const vy = new Float32Array(CAPACITY);
    const vz = new Float32Array(CAPACITY);
    const life = new Float32Array(CAPACITY);
    const kind = new Uint8Array(CAPACITY);
    let cursor = 0;
    let time = 0;
    const counts = [0, 0, 0];
    const tint = new Color();
    const kindColors = [
      new Color(palette.ink),
      new Color(palette.sky),
      new Color(palette.violet),
    ];
    const white = new Color("#f2f6f8");

    const emit = (
      x: number,
      y: number,
      z: number,
      velocityX: number,
      velocityY: number,
      velocityZ: number,
      type: number
    ) => {
      const index = cursor;
      cursor = (cursor + 1) % CAPACITY;
      px[index] = x;
      py[index] = y;
      pz[index] = z;
      vx[index] = velocityX;
      vy[index] = velocityY;
      vz[index] = velocityZ;
      life[index] = type === BUBBLE ? 2 + random() * 2 : 5 + random() * 5;
      kind[index] = type;
    };

    /** 元の位置 (x, z) の水面の点について、尖り具合と速度を調べる。 */
    const probe = (x: number, z: number) => {
      const e = 0.08;
      const center = gerstnerPoint(state, x, z);
      const right = gerstnerPoint(state, x + e, z);
      const forward = gerstnerPoint(state, x, z + e);
      // 水平方向の伸び縮み：1 なら平ら、0 に近いほど波頭が折れ曲がりかけている
      const jacobian =
        ((right.x - center.x) * (forward.z - center.z) -
          (right.z - center.z) * (forward.x - center.x)) /
        (e * e);
      const saved = state.uTime.value;
      state.uTime.value = saved + 0.02;
      const later = gerstnerPoint(state, x, z);
      state.uTime.value = saved;
      return {
        point: center,
        jacobian,
        velocity: {
          x: (later.x - center.x) / 0.02,
          y: (later.y - center.y) / 0.02,
          z: (later.z - center.z) / 0.02,
        },
      };
    };

    return {
      update({ dt }) {
        time += dt;
        state.uTime.value = time;
        state.uSteepness.value = Number(params["steepness"]);
        ocean.visible = params["ocean"] === true;
        const threshold = Number(params["threshold"]);

        // 1. 波頭を探して粒子を生む
        if (dt > 0) {
          for (let sample = 0; sample < 260; sample++) {
            const x = (random() - 0.5) * 2 * AREA;
            const z = (random() - 0.5) * 2 * AREA;
            const { point, jacobian, velocity } = probe(x, z);
            if (jacobian > threshold || velocity.y < -0.2) {
              continue;
            }
            const amount = Math.ceil(((threshold - jacobian) / threshold) * 6);
            for (let n = 0; n < amount; n++) {
              const roll = random();
              const type = roll < 0.55 ? SPRAY : roll < 0.8 ? FOAM : BUBBLE;
              const spread = 0.8;
              emit(
                point.x + (random() - 0.5) * 0.4,
                point.y + (type === BUBBLE ? -0.2 - random() * 0.4 : 0.05),
                point.z + (random() - 0.5) * 0.4,
                velocity.x * 1.1 + (random() - 0.5) * spread,
                type === SPRAY
                  ? Math.max(velocity.y, 0) + 1 + random() * 2.5
                  : 0,
                velocity.z * 1.1 + (random() - 0.5) * spread,
                type
              );
            }
          }
        }

        // 2. 水面との位置関係で、飛沫・泡・気泡の動きを切り替える
        counts.fill(0);
        for (let index = 0; index < CAPACITY; index++) {
          if ((life[index] ?? 0) <= 0) {
            cloud.sizes[index] = 0;
            continue;
          }
          let x = px[index] ?? 0;
          let y = py[index] ?? 0;
          let z = pz[index] ?? 0;
          const surface = waterHeight(state, x, z);
          let type = SPRAY;
          if (y > surface + 0.06) {
            // 飛沫：重力と空気抵抗だけで飛ぶ
            vy[index] = (vy[index] ?? 0) - GRAVITY * dt;
            const drag = 1 - 0.4 * dt;
            vx[index] = (vx[index] ?? 0) * drag;
            vz[index] = (vz[index] ?? 0) * drag;
          } else if (y < surface - 0.12) {
            // 気泡：浮力で浮かび、水の抵抗で横の動きは止まる
            type = BUBBLE;
            vy[index] = (vy[index] ?? 0) + (2.2 - (vy[index] ?? 0) * 3) * dt;
            const drag = 1 - 3 * dt;
            vx[index] = (vx[index] ?? 0) * drag;
            vz[index] = (vz[index] ?? 0) * drag;
          } else {
            // 泡：水面に張り付き、少しずつ減速しながら波に運ばれる
            type = FOAM;
            y = surface + 0.02;
            vy[index] = 0;
            const drag = 1 - 0.8 * dt;
            vx[index] = (vx[index] ?? 0) * drag;
            vz[index] = (vz[index] ?? 0) * drag;
          }
          x += (vx[index] ?? 0) * dt;
          y += (vy[index] ?? 0) * dt;
          z += (vz[index] ?? 0) * dt;
          px[index] = x;
          py[index] = y;
          pz[index] = z;
          kind[index] = type;
          life[index] = (life[index] ?? 0) - dt * (type === FOAM ? 1 : 0.6);
          counts[type] = (counts[type] ?? 0) + 1;

          cloud.positions[index * 3] = x;
          cloud.positions[index * 3 + 1] = y;
          cloud.positions[index * 3 + 2] = z;
          const fade = Math.min(1, (life[index] ?? 0) / 1.5);
          cloud.sizes[index] =
            (type === SPRAY ? 0.8 : type === FOAM ? 1.3 : 0.7) * fade;
          tint.copy(
            params["color"] === "type" ? (kindColors[type] ?? white) : white
          );
          cloud.colors[index * 3] = tint.r;
          cloud.colors[index * 3 + 1] = tint.g;
          cloud.colors[index * 3 + 2] = tint.b;
        }
        cloud.commit();

        context.readout("飛沫", `${counts[SPRAY]}`);
        context.readout("泡", `${counts[FOAM]}`);
        context.readout("気泡", `${counts[BUBBLE]}`);
        context.caption(
          "波頭が尖って崩れかけた所（水面が強く縮んだ所）から粒子を生む。水面より上なら飛沫として放物線を描き、水面に落ちると泡になって漂い、水中の粒子は気泡として浮かび上がって泡になる。"
        );
      },
    };
  },
};
