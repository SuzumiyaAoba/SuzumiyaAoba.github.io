import {
  CanvasTexture,
  CylinderGeometry,
  Mesh,
  PointLight,
  SRGBColorSpace,
} from "three";
import { palette, rng, standard, TAU } from "../../kit";
import { particleSystem, smokePuff } from "../../particles";
import type { DemoModule } from "../../types";

const SMOKE = 70;
const FIRE = 90;
const LIFE = 5;

let outlineTexture: CanvasTexture | undefined;
const outline = () => {
  if (outlineTexture) {
    return outlineTexture;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    context.strokeStyle = "rgba(255,255,255,1)";
    context.lineWidth = 3;
    context.strokeRect(2, 2, 60, 60);
  }
  outlineTexture = new CanvasTexture(canvas);
  outlineTexture.colorSpace = SRGBColorSpace;
  return outlineTexture;
};

export const demo: DemoModule = {
  alt: "焚き火から立ち上る煙のデモ。煙はすべて平らな板に画像を貼ったものだが、ビルボードでは常にカメラの方を向くため、視点を回しても立体的な煙に見える。板をワールドに固定すると、横から見たとき紙のように薄く見える。",
  camera: { position: [5.5, 2.6, 5.5], target: [0, 1.6, 0], autoRotate: 12 },
  bloom: { strength: 0.8, radius: 0.5, threshold: 0.7 },
  studio: { background: "#070a11" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "煙の板の向き",
      value: "billboard",
      options: [
        { value: "billboard", label: "ビルボード（カメラを向く）" },
        { value: "fixed", label: "ワールドに固定" },
      ],
    },
    { type: "toggle", key: "outline", label: "板の輪郭を表示", value: false },
    { type: "toggle", key: "rotate", label: "視点を自動で回す", value: true },
  ],
  legend: [
    { color: palette.muted, label: "煙（通常の合成）" },
    { color: palette.amber, label: "炎と火の粉（加算合成）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(2);
    for (let index = 0; index < 4; index++) {
      const log = new Mesh(
        new CylinderGeometry(0.1, 0.12, 1.3, 12),
        standard("#4a3527", { roughness: 0.9 })
      );
      log.rotation.set(Math.PI / 2 - 0.25, (index / 4) * Math.PI, 0);
      log.position.y = 0.16;
      log.castShadow = true;
      scene.add(log);
    }
    const glow = new PointLight("#ff9a4a", 6, 6, 1.5);
    glow.position.set(0, 0.6, 0);
    scene.add(glow);

    const smokeBillboard = particleSystem({
      capacity: SMOKE,
      texture: smokePuff(),
      additive: false,
      mode: "billboard",
    });
    const smokeFixed = particleSystem({
      capacity: SMOKE,
      texture: smokePuff(),
      additive: false,
      mode: "fixed",
    });
    const outlineBillboard = particleSystem({
      capacity: SMOKE,
      texture: outline(),
      additive: true,
      mode: "billboard",
    });
    const outlineFixed = particleSystem({
      capacity: SMOKE,
      texture: outline(),
      additive: true,
      mode: "fixed",
    });
    const fire = particleSystem({
      capacity: FIRE,
      additive: true,
      mode: "billboard",
    });
    scene.add(smokeBillboard, smokeFixed, outlineBillboard, outlineFixed, fire);

    const smokeAge = Float32Array.from(
      { length: SMOKE },
      () => random() * LIFE
    );
    const smokeSeed = Float32Array.from({ length: SMOKE }, () => random());
    const fireAge = Float32Array.from({ length: FIRE }, () => random());
    const fireSeed = Float32Array.from({ length: FIRE }, () => random());

    return {
      update({ dt, time }) {
        for (let index = 0; index < SMOKE; index++) {
          const age = ((smokeAge[index] ?? 0) + dt) % LIFE;
          smokeAge[index] = age;
          const seed = smokeSeed[index] ?? 0;
          const t = age / LIFE;
          const angle = seed * TAU + time * 0.2;
          smokeBillboard.positions[index * 3] =
            Math.cos(angle) * 0.15 +
            Math.sin(t * 5 + seed * 9) * 0.35 * t +
            t * 0.6;
          smokeBillboard.positions[index * 3 + 1] = 0.6 + t * 3.6;
          smokeBillboard.positions[index * 3 + 2] =
            Math.sin(angle) * 0.15 + Math.cos(t * 4 + seed * 7) * 0.3 * t;
          smokeBillboard.sizes[index] = 0.5 + t * 1.8;
          smokeBillboard.rotations[index] = seed * TAU + t * (seed - 0.5) * 2;
          const alpha = Math.min(1, t * 6) * (1 - t) * 0.55;
          const shade = 0.55 - t * 0.2;
          smokeBillboard.colors.set(
            [shade, shade, shade * 1.05, alpha],
            index * 4
          );
        }
        for (let index = 0; index < FIRE; index++) {
          const seed = fireSeed[index] ?? 0;
          const life = 0.6 + seed * 0.8;
          const age = ((fireAge[index] ?? 0) + dt) % life;
          fireAge[index] = age;
          const t = age / life;
          const ember = seed > 0.8;
          const angle = seed * 97;
          fire.positions[index * 3] =
            Math.cos(angle) * 0.2 * (1 - t) +
            (ember ? Math.sin(t * 9 + seed) * 0.3 : 0);
          fire.positions[index * 3 + 1] = 0.25 + t * (ember ? 2.8 : 1.1);
          fire.positions[index * 3 + 2] = Math.sin(angle) * 0.2 * (1 - t);
          fire.sizes[index] = ember
            ? 0.06
            : (0.55 - t * 0.4) * (0.7 + seed * 0.5);
          const heat = 1 - t;
          fire.colors.set(
            ember
              ? [1.4, 0.7, 0.25, heat]
              : [1.2 * heat + 0.3, 0.45 * heat + 0.1, 0.1 * heat, heat * 0.8],
            index * 4
          );
        }
        fire.setCount(FIRE);
        fire.commit();

        context.setAutoRotate(params["rotate"] === true);
        const fixed = params["mode"] === "fixed";
        const showOutline = params["outline"] === true;
        for (const target of [smokeFixed, outlineBillboard, outlineFixed]) {
          target.positions.set(smokeBillboard.positions);
          target.sizes.set(smokeBillboard.sizes);
          target.rotations.set(smokeBillboard.rotations);
        }
        smokeFixed.colors.set(smokeBillboard.colors);
        for (let index = 0; index < SMOKE; index++) {
          const alpha = Math.min(
            1,
            (smokeBillboard.colors[index * 4 + 3] ?? 0) * 2.5
          );
          outlineBillboard.colors.set([0.25, 0.85, 0.8, alpha], index * 4);
          outlineFixed.colors.set([0.25, 0.85, 0.8, alpha], index * 4);
        }
        for (const target of [
          smokeBillboard,
          smokeFixed,
          outlineBillboard,
          outlineFixed,
        ]) {
          target.setCount(SMOKE);
          target.commit();
        }
        smokeBillboard.visible = !fixed;
        smokeFixed.visible = fixed;
        outlineBillboard.visible = showOutline && !fixed;
        outlineFixed.visible = showOutline && fixed;
        glow.intensity =
          5 + Math.sin(time * 13) * 0.8 + Math.sin(time * 7.3) * 0.6;

        context.readout("煙の板", `${SMOKE} 枚`);
        context.readout("1 枚あたりの三角形", "2 個");
        context.caption(
          fixed
            ? "板をワールドに固定すると、視点が回り込んだときに板の薄さがそのまま見えてしまう。"
            : "板の正面を毎フレームカメラへ向け直す。わずか 2 枚の三角形でも、どの角度から見ても厚みのある煙に見える。"
        );
      },
    };
  },
};
