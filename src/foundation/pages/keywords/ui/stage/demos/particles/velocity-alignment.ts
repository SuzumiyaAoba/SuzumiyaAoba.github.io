import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import { palette, rng, standard, TAU } from "../../kit";
import { particleSystem, smokePuff } from "../../particles";
import type { DemoModule } from "../../types";

const COUNT = 520;
const HEIGHT = 5;
const FORWARD = new Vector3(0, 0, 1);

export const demo: DemoModule = {
  alt: "竜巻に巻き上げられる木片のデモ。木片の長軸を進む向きに合わせると、渦に沿って流れる筋が見え、風の速さと向きが伝わる。ランダムな向きのままだと、同じ速さで動いていても散らかった破片にしか見えない。",
  camera: { position: [7.6, 3.8, 7.6], target: [0, 2.5, 0] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "粒子の向き",
      value: "aligned",
      options: [
        { value: "aligned", label: "速度方向へ整列" },
        { value: "random", label: "ランダム（固定）" },
      ],
    },
    {
      type: "range",
      key: "spin",
      label: "渦の速さ",
      min: 0.5,
      max: 4,
      step: 0.1,
      value: 2.2,
    },
    {
      type: "range",
      key: "stretch",
      label: "速さに応じた伸び",
      min: 0,
      max: 1.5,
      step: 0.05,
      value: 0.6,
      hint: "整列と組み合わせると、速い粒子ほど細長く見えて勢いが出ます。",
    },
  ],
  legend: [{ color: palette.amber, label: "木片" }],
  setup(context) {
    const { scene, params } = context;
    const random = rng(23);
    const sticks = new InstancedMesh(
      new BoxGeometry(0.04, 0.04, 0.34),
      standard("#ffffff", { roughness: 0.7 }),
      COUNT
    );
    sticks.castShadow = true;
    scene.add(sticks);
    const dust = particleSystem({
      capacity: 60,
      texture: smokePuff(),
      additive: false,
    });
    scene.add(dust);

    const heights = Float32Array.from(
      { length: COUNT },
      () => random() * HEIGHT
    );
    const angles = Float32Array.from({ length: COUNT }, () => random() * TAU);
    const offsets = Float32Array.from({ length: COUNT }, () => random());
    const randomRotations = Array.from({ length: COUNT }, () =>
      new Quaternion().setFromAxisAngle(
        new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
        random() * TAU
      )
    );
    const tint = new Color();
    for (let index = 0; index < COUNT; index++) {
      tint.set(
        index % 4 === 0
          ? "#caa472"
          : index % 4 === 1
            ? "#8c6a45"
            : index % 4 === 2
              ? "#6f8a4d"
              : "#a58e6d"
      );
      sticks.setColorAt(index, tint);
    }
    const matrix = new Matrix4();
    const position = new Vector3();
    const velocity = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    const dustAge = Float32Array.from({ length: 60 }, () => random());

    return {
      update({ dt }) {
        const spin = Number(params["spin"]);
        const aligned = params["mode"] === "aligned";
        const stretch = Number(params["stretch"]);
        for (let index = 0; index < COUNT; index++) {
          let height =
            (heights[index] ?? 0) + dt * (0.8 + (offsets[index] ?? 0) * 0.8);
          if (height > HEIGHT) {
            height -= HEIGHT;
          }
          heights[index] = height;
          const radius =
            0.25 + (height / HEIGHT) ** 1.4 * 2.2 + (offsets[index] ?? 0) * 0.4;
          const angularSpeed = (spin * 1.6) / (0.5 + radius);
          const angle = (angles[index] ?? 0) + dt * angularSpeed;
          angles[index] = angle;
          position.set(
            Math.cos(angle) * radius,
            height + 0.1,
            Math.sin(angle) * radius
          );
          // 接線方向の速度 + 上昇 + わずかな外向き
          velocity.set(
            -Math.sin(angle) * angularSpeed * radius,
            0.8 + (offsets[index] ?? 0) * 0.8,
            Math.cos(angle) * angularSpeed * radius
          );
          const speed = velocity.length();
          if (aligned) {
            rotation.setFromUnitVectors(FORWARD, velocity.clone().normalize());
            scale.set(1, 1, 1 + speed * stretch * 0.25);
          } else {
            rotation.copy(randomRotations[index] ?? rotation);
            scale.set(1, 1, 1);
          }
          matrix.compose(position, rotation, scale);
          sticks.setMatrixAt(index, matrix);
        }
        sticks.instanceMatrix.needsUpdate = true;

        for (let index = 0; index < 60; index++) {
          const age = ((dustAge[index] ?? 0) + dt * 0.25) % 1;
          dustAge[index] = age;
          const angle = index * 2.4 + age * spin * 6;
          const radius = 0.4 + age * 1.6;
          dust.positions.set(
            [
              Math.cos(angle) * radius,
              0.3 + age * 1.2,
              Math.sin(angle) * radius,
            ],
            index * 3
          );
          dust.sizes[index] = 0.8 + age * 1.5;
          dust.rotations[index] = index;
          dust.colors.set(
            [0.55, 0.5, 0.45, Math.sin(age * Math.PI) * 0.2],
            index * 4
          );
        }
        dust.setCount(60);
        dust.commit();
        context.readout("木片", `${COUNT} 個`);
        context.caption(
          aligned
            ? "各粒子の向きを毎フレーム速度ベクトルに合わせる。細長い形が流れの向きを示し、渦の回転がはっきり見える。"
            : "向きがばらばらだと、同じ速度場で動いていても風の流れが読み取れない。"
        );
      },
    };
  },
};
