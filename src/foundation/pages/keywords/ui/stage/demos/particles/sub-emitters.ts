import { Color, PointLight } from "three";
import { rng, TAU } from "../../kit";
import { particleSystem } from "../../particles";
import type { DemoModule } from "../../types";

const CAPACITY = 5000;
const GRAVITY = 4.5;

const Kind = {
  Rocket: 0,
  Trail: 1,
  Star: 2,
  Crackle: 3,
} as const;
type Kind = (typeof Kind)[keyof typeof Kind];

const starColors = [
  "#ff5a7a",
  "#ffd166",
  "#5aa9ff",
  "#7dffb2",
  "#c49bff",
  "#ff9b54",
];

export const demo: DemoModule = {
  alt: "夜空に打ち上がる花火のデモ。上昇する玉（親の粒子）は移動中に火の粉の尾を出し、寿命を迎えると色とりどりの星を放射状に放つ。星が消えるときにはさらに小さなパチパチという光が生まれる。サブエミッターをそれぞれ切り替えて効果を確かめられる。",
  camera: { position: [0, 3.6, 12.5], target: [0, 4.6, 0] },
  bloom: { strength: 1.2, radius: 0.6, threshold: 0.4 },
  studio: { background: "#04060b", fog: false },
  controls: [
    {
      type: "toggle",
      key: "trail",
      label: "上昇中に尾を出す（移動イベント）",
      value: true,
    },
    {
      type: "toggle",
      key: "burst",
      label: "消滅時に星を放つ（死亡イベント）",
      value: true,
    },
    {
      type: "toggle",
      key: "crackle",
      label: "星の消滅時にパチパチ（孫）",
      value: true,
    },
    { type: "toggle", key: "auto", label: "自動で打ち上げる", value: true },
    { type: "button", key: "launch", label: "打ち上げ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(11);
    const system = particleSystem({
      capacity: CAPACITY,
      mode: "stretched",
      stretch: 0.12,
    });
    scene.add(system);
    const flash = new PointLight("#ffd9a0", 0, 30, 1.2);
    scene.add(flash);

    const kind = new Uint8Array(CAPACITY);
    const age = new Float32Array(CAPACITY);
    const life = new Float32Array(CAPACITY).fill(-1);
    const baseColor = new Float32Array(CAPACITY * 3);
    const size = new Float32Array(CAPACITY);
    let cursor = 0;
    let launchTimer = 0;
    let events = 0;
    const color = new Color();

    const spawn = (
      type: Kind,
      x: number,
      y: number,
      z: number,
      vx: number,
      vy: number,
      vz: number,
      lifetime: number,
      tint: Color,
      radius: number
    ) => {
      const index = cursor;
      cursor = (cursor + 1) % CAPACITY;
      kind[index] = type;
      age[index] = 0;
      life[index] = lifetime;
      size[index] = radius;
      system.positions.set([x, y, z], index * 3);
      system.velocities.set([vx, vy, vz], index * 3);
      baseColor.set([tint.r, tint.g, tint.b], index * 3);
    };
    const launch = () => {
      spawn(
        Kind.Rocket,
        (random() - 0.5) * 6,
        0.1,
        (random() - 0.5) * 2,
        (random() - 0.5) * 1.2,
        6 + random() * 1.3,
        (random() - 0.5) * 0.6,
        1.1 + random() * 0.4,
        color.set("#ffe2b0").multiplyScalar(2),
        0.07
      );
      events++;
    };

    return {
      action(key) {
        if (key === "launch") {
          launch();
        }
      },
      update({ dt }) {
        if (params["auto"] === true) {
          launchTimer += dt;
          if (launchTimer > 0.9) {
            launchTimer = 0;
            launch();
          }
        }
        const useTrail = params["trail"] === true;
        const useBurst = params["burst"] === true;
        const useCrackle = params["crackle"] === true;
        let alive = 0;
        let flashLevel = 0;
        for (let index = 0; index < CAPACITY; index++) {
          const lifetime = life[index] ?? -1;
          if (lifetime < 0) {
            system.sizes[index] = 0;
            continue;
          }
          const current = (age[index] ?? 0) + dt;
          age[index] = current;
          const i3 = index * 3;
          const type = kind[index] ?? Kind.Trail;
          const x = system.positions[i3] ?? 0;
          const y = system.positions[i3 + 1] ?? 0;
          const z = system.positions[i3 + 2] ?? 0;
          if (current >= lifetime) {
            life[index] = -1;
            system.sizes[index] = 0;
            // 死亡イベント：子の粒子を生む
            if (type === Kind.Rocket && useBurst) {
              events++;
              const tint = color
                .set(
                  starColors[Math.floor(random() * starColors.length)] ?? "#fff"
                )
                .multiplyScalar(3.2);
              const speed = 3 + random() * 1.5;
              for (let star = 0; star < 140; star++) {
                const theta = random() * TAU;
                const phi = Math.acos(2 * random() - 1);
                const s = speed * (0.85 + random() * 0.3);
                spawn(
                  Kind.Star,
                  x,
                  y,
                  z,
                  Math.sin(phi) * Math.cos(theta) * s,
                  Math.cos(phi) * s,
                  Math.sin(phi) * Math.sin(theta) * s,
                  1.3 + random() * 0.6,
                  tint,
                  0.11
                );
              }
              flash.position.set(x, y, z);
              flashLevel = 1;
            } else if (type === Kind.Star && useCrackle && random() < 0.25) {
              events++;
              for (let spark = 0; spark < 3; spark++) {
                spawn(
                  Kind.Crackle,
                  x,
                  y,
                  z,
                  (random() - 0.5) * 1.5,
                  (random() - 0.5) * 1.5,
                  (random() - 0.5) * 1.5,
                  0.15 + random() * 0.15,
                  color.set("#ffffff").multiplyScalar(3),
                  0.035
                );
              }
            }
            continue;
          }
          alive++;
          const t = current / lifetime;
          const drag =
            type === Kind.Star ? 1.6 : type === Kind.Trail ? 2.5 : 0.1;
          for (let axis = 0; axis < 3; axis++) {
            const velocity =
              (system.velocities[i3 + axis] ?? 0) * Math.exp(-drag * dt);
            system.velocities[i3 + axis] =
              velocity -
              (axis === 1
                ? GRAVITY * dt * (type === Kind.Rocket ? 0.4 : 1)
                : 0);
            system.positions[i3 + axis] =
              (system.positions[i3 + axis] ?? 0) +
              (system.velocities[i3 + axis] ?? 0) * dt;
          }
          // 移動イベント：上昇中の玉から尾の火の粉を出す
          if (type === Kind.Rocket && useTrail) {
            for (let spark = 0; spark < 3; spark++) {
              spawn(
                Kind.Trail,
                x,
                y,
                z,
                (random() - 0.5) * 0.8,
                -0.5 - random(),
                (random() - 0.5) * 0.8,
                0.4 + random() * 0.4,
                color.set("#ffb86b").multiplyScalar(1.6),
                0.03
              );
            }
          }
          const fade =
            type === Kind.Star
              ? Math.min(1, current * 6) *
                (1 - t) ** 1.5 *
                (0.7 + 0.3 * Math.sin(current * 30 + index))
              : 1 - t;
          system.sizes[index] =
            (size[index] ?? 0.05) * (type === Kind.Crackle ? 1 + t : 1);
          system.colors.set(
            [
              (baseColor[i3] ?? 1) * fade,
              (baseColor[i3 + 1] ?? 1) * fade,
              (baseColor[i3 + 2] ?? 1) * fade,
              fade,
            ],
            index * 4
          );
        }
        system.setCount(CAPACITY);
        system.commit();
        flash.intensity = Math.max(
          flash.intensity * Math.exp(-dt * 6),
          flashLevel * 22
        );
        context.readout("生きている粒子", `${alive}`);
        context.readout("発生したイベント", `${events}`);
        context.caption(
          "親の粒子に『移動中』『消滅時』のイベントを持たせ、そこから子の放出を始める。1 本の打ち上げ設定から、尾・開花・パチパチが連鎖して生まれる。"
        );
      },
    };
  },
};
