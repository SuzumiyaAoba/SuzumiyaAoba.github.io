import { BoxGeometry, CylinderGeometry, Group, Mesh, PointLight } from "three";
import { palette, rng, standard } from "../../kit";
import { particleSystem } from "../../particles";
import type { DemoModule } from "../../types";

const SPARKS = 500;
const RAIN = 700;
const GRAVITY = 9.8;
const CONTACT = { x: 0.9, y: 0.9, z: 0 };

export const demo: DemoModule = {
  alt: "回転する砥石から飛び散る火花と、降りしきる雨のデモ。粒子を速度の方向へ引き伸ばすと、同じ小さな粒でも高速で飛ぶ火花や落ちる雨粒の勢いが出る。伸ばさない通常の板では、ただの点が散らばるだけに見える。",
  camera: { position: [3.8, 2.2, 5.8], target: [0.4, 1, 0] },
  bloom: { strength: 1, radius: 0.4, threshold: 0.6 },
  studio: { background: "#06080d" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "粒子の形",
      value: "stretched",
      options: [
        { value: "stretched", label: "速度方向へ伸ばす" },
        { value: "billboard", label: "通常のビルボード" },
      ],
    },
    {
      type: "range",
      key: "stretch",
      label: "伸びの強さ",
      min: 0,
      max: 0.2,
      step: 0.005,
      value: 0.06,
      hint: "速度 × この値だけ、板を進行方向と逆向きに伸ばします。",
    },
    { type: "toggle", key: "rain", label: "雨を降らせる", value: true },
  ],
  legend: [
    { color: palette.amber, label: "火花" },
    { color: palette.sky, label: "雨粒" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(4);
    const grinder = new Group();
    const base = new Mesh(
      new BoxGeometry(1.2, 0.5, 0.7),
      standard("#2e3644", { metalness: 0.5, roughness: 0.4 })
    );
    base.position.set(-0.2, 0.25, 0);
    const wheel = new Mesh(
      new CylinderGeometry(0.55, 0.55, 0.18, 48),
      standard("#6f7887", { metalness: 0.3, roughness: 0.7 })
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0.35, 0.95, 0);
    const bar = new Mesh(
      new BoxGeometry(1.4, 0.12, 0.12),
      standard("#8a94a6", { metalness: 0.8, roughness: 0.3 })
    );
    bar.position.set(1.4, 0.94, 0);
    bar.rotation.z = 0.35;
    grinder.add(base, wheel, bar);
    grinder.traverse((child) => {
      child.castShadow = true;
    });
    scene.add(grinder);
    const flash = new PointLight("#ffb050", 3, 5, 1.6);
    flash.position.set(CONTACT.x, CONTACT.y, 0.3);
    scene.add(flash);

    const sparksStretched = particleSystem({
      capacity: SPARKS,
      mode: "stretched",
    });
    const sparksDots = particleSystem({ capacity: SPARKS, mode: "billboard" });
    const rainStretched = particleSystem({ capacity: RAIN, mode: "stretched" });
    const rainDots = particleSystem({ capacity: RAIN, mode: "billboard" });
    scene.add(sparksStretched, sparksDots, rainStretched, rainDots);

    const sparkAge = new Float32Array(SPARKS).fill(99);
    const sparkLife = new Float32Array(SPARKS);
    let cursor = 0;
    const spawnSpark = () => {
      const index = cursor;
      cursor = (cursor + 1) % SPARKS;
      const angle = -0.2 + (random() - 0.5) * 0.9;
      const speed = 4 + random() * 6;
      sparksStretched.positions.set(
        [CONTACT.x, CONTACT.y, (random() - 0.5) * 0.15],
        index * 3
      );
      sparksStretched.velocities.set(
        [
          Math.cos(angle) * speed,
          Math.sin(angle) * speed + 1.5,
          (random() - 0.5) * 3,
        ],
        index * 3
      );
      sparkAge[index] = 0;
      sparkLife[index] = 0.5 + random() * 0.9;
    };
    for (let index = 0; index < RAIN; index++) {
      rainStretched.positions.set(
        [(random() - 0.5) * 12, random() * 8, (random() - 0.5) * 8],
        index * 3
      );
      rainStretched.velocities.set([0.8, -11 - random() * 4, 0], index * 3);
    }
    let emit = 0;

    return {
      update({ dt, time }) {
        wheel.rotation.y += dt * 40;
        emit += dt * 420;
        while (emit >= 1) {
          emit -= 1;
          spawnSpark();
        }
        for (let index = 0; index < SPARKS; index++) {
          const age = (sparkAge[index] ?? 99) + dt;
          sparkAge[index] = age;
          const life = sparkLife[index] ?? 1;
          const i3 = index * 3;
          if (age > life) {
            sparksStretched.sizes[index] = 0;
            continue;
          }
          const vy = (sparksStretched.velocities[i3 + 1] ?? 0) - GRAVITY * dt;
          sparksStretched.velocities[i3 + 1] = vy;
          for (let axis = 0; axis < 3; axis++) {
            sparksStretched.positions[i3 + axis] =
              (sparksStretched.positions[i3 + axis] ?? 0) +
              (sparksStretched.velocities[i3 + axis] ?? 0) * dt;
          }
          if ((sparksStretched.positions[i3 + 1] ?? 0) < 0.02 && vy < 0) {
            sparksStretched.positions[i3 + 1] = 0.02;
            sparksStretched.velocities[i3 + 1] = -vy * 0.35;
            sparksStretched.velocities[i3] =
              (sparksStretched.velocities[i3] ?? 0) * 0.6;
            sparksStretched.velocities[i3 + 2] =
              (sparksStretched.velocities[i3 + 2] ?? 0) * 0.6;
          }
          const t = age / life;
          sparksStretched.sizes[index] = 0.045 * (1 - t * 0.5);
          sparksStretched.colors.set(
            [2.2, 1.1 - t * 0.6, 0.35 - t * 0.3, 1 - t * t],
            index * 4
          );
        }
        for (let index = 0; index < RAIN; index++) {
          const i3 = index * 3;
          let y =
            (rainStretched.positions[i3 + 1] ?? 0) +
            (rainStretched.velocities[i3 + 1] ?? 0) * dt;
          let x =
            (rainStretched.positions[i3] ?? 0) +
            (rainStretched.velocities[i3] ?? 0) * dt;
          if (y < 0) {
            y += 8;
            x = (random() - 0.5) * 12;
          }
          rainStretched.positions[i3] = x;
          rainStretched.positions[i3 + 1] = y;
          rainStretched.sizes[index] = 0.02;
          rainStretched.colors.set([0.55, 0.7, 0.95, 0.55], index * 4);
        }
        const stretch = Number(params["stretch"]);
        sparksStretched.setStretch(stretch);
        rainStretched.setStretch(stretch);
        for (const [source, target] of [
          [sparksStretched, sparksDots],
          [rainStretched, rainDots],
        ] as const) {
          target.positions.set(source.positions);
          target.sizes.set(source.sizes);
          target.colors.set(source.colors);
          source.setCount(source.capacity);
          target.setCount(target.capacity);
          source.commit();
          target.commit();
        }
        const stretched = params["mode"] === "stretched";
        const rain = params["rain"] === true;
        sparksStretched.visible = stretched;
        sparksDots.visible = !stretched;
        rainStretched.visible = stretched && rain;
        rainDots.visible = !stretched && rain;
        flash.intensity = 2.5 + Math.sin(time * 40) * 0.8;
        context.readout("火花", `${SPARKS} 粒`);
        context.readout("雨粒", rain ? `${RAIN} 粒` : "—");
        context.caption(
          stretched
            ? "板の長軸を画面上の速度方向に合わせ、速いほど長く伸ばす。1 フレームの間に動いた軌跡が残像のように見え、速さが伝わる。"
            : "同じ速度で飛んでいても、丸い点のままでは止まった粉がばらまかれているように見える。"
        );
      },
    };
  },
};
