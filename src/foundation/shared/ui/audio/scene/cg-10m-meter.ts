import {
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
} from "three";
import type { ModelParts } from "./parts";

export const cg10mMeter = {
  front: 115,
  y: 44.5,
  radius: 16.8,
  outerRadius: 20.5,
  dialDepth: -5.7,
  lensDepth: -2.6,
} as const;

function drawScale(context: CanvasRenderingContext2D) {
  const { radius } = cg10mMeter;
  context.translate(radius, radius);
  const light = context.createRadialGradient(-3, -6, 1, 0, 0, 19);
  light.addColorStop(0, "#b4e2ff");
  light.addColorStop(0.65, "#86c7f4");
  light.addColorStop(1, "#5c97c6");
  context.fillStyle = light;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  const scaleRadius = 13.5;
  const start = -Math.PI * 0.77;
  const sweep = Math.PI * 0.54;
  for (let index = 0; index <= 20; index += 1) {
    const angle = start + (index / 20) * sweep;
    const major = index % 4 === 0;
    const length = major ? 1.8 : 1;
    context.strokeStyle = index > 12 ? "#9a3e50" : "#0f1d2d";
    context.lineWidth = major ? 0.23 : 0.16;
    context.beginPath();
    context.moveTo(
      Math.cos(angle) * scaleRadius,
      4 + Math.sin(angle) * scaleRadius
    );
    context.lineTo(
      Math.cos(angle) * (scaleRadius - length),
      4 + Math.sin(angle) * (scaleRadius - length)
    );
    context.stroke();
    if (major) {
      context.save();
      context.translate(
        Math.cos(angle) * (scaleRadius + 1.6),
        4 + Math.sin(angle) * (scaleRadius + 1.6)
      );
      context.rotate(angle + Math.PI / 2);
      context.fillStyle = context.strokeStyle;
      context.font = "1.95px Arial";
      context.textAlign = "center";
      context.fillText(String(index / 2), 0, 0);
      context.restore();
    }
  }
  for (const [from, to, color] of [
    [0, 0.6, "#0f1d2d"],
    [0.6, 1, "#9a3e50"],
  ] as const) {
    context.strokeStyle = color;
    for (const [arcRadius, thickness] of [
      [scaleRadius, 0.25],
      [scaleRadius - 1.9, 0.12],
    ] as const) {
      context.lineWidth = thickness;
      context.beginPath();
      context.arc(0, 4, arcRadius, start + sweep * from, start + sweep * to);
      context.stroke();
    }
  }
  context.fillStyle = "#0f1d2d";
  context.textAlign = "center";
  context.font = "2.4px Arial";
  context.fillText("STATUS", 0, -3.1);
  context.font = "1.95px Arial";
  context.fillText("−", -14, -4.1);
  context.fillStyle = "#9a3e50";
  context.fillText("+", 14, -4.1);
}

export function cg10mMovementCoverGeometry() {
  const { radius } = cg10mMeter;
  const edge = Math.sqrt(radius ** 2 - 1.1 ** 2);
  const cover = new Shape();
  cover.moveTo(-edge, -1.1);
  cover.lineTo(-7.4, -1.1);
  cover.bezierCurveTo(-5.5, 1, -2.7, 2.5, 0, 2.5);
  cover.bezierCurveTo(2.7, 2.5, 5.5, 1, 7.4, -1.1);
  cover.lineTo(edge, -1.1);
  cover.absarc(
    0,
    0,
    radius,
    Math.asin(-1.1 / radius),
    -Math.PI - Math.asin(-1.1 / radius),
    true
  );
  cover.closePath();
  return new ExtrudeGeometry(cover, {
    depth: 0.35,
    bevelEnabled: true,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    bevelSegments: 4,
    curveSegments: 64,
  });
}

export function createCg10mMeter(parts: ModelParts) {
  const { front, y, radius, dialDepth, lensDepth } = cg10mMeter;
  const face = parts.print(
    radius * 2,
    radius * 2,
    [0, y, front + dialDepth],
    drawScale,
    "Backlit graduated oven-status scale with printed ink",
    1024,
    true
  );
  // 屈折用の背景へ目盛りも描き込み、ガラス越しに文字が消えるのを防ぐ。
  face.material.transparent = false;
  face.material.alphaTest = 0.3;
  face.material.depthWrite = true;
  parts.lathe(
    [
      [radius + 0.1, -6.1],
      [radius + 0.1, -2.6],
      [radius - 0.1, -2.6],
      [radius - 0.1, -6.1],
    ],
    [0, y, front],
    parts.black,
    "Deep black lining behind the meter bezel"
  );
  const blade = new Shape();
  blade.moveTo(-0.2, -1.6);
  blade.lineTo(-0.05, 15);
  blade.lineTo(0.05, 15);
  blade.lineTo(0.2, -1.6);
  blade.closePath();
  const needle = parts.mesh(
    new ExtrudeGeometry(blade, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 2,
    }),
    new MeshStandardMaterial({
      color: 0x0b_13_1b,
      metalness: 0.35,
      roughness: 0.35,
    }),
    [0, y - 4, front - 5.15],
    "Tapered moving-coil pointer separated from the printed scale"
  );
  needle.rotation.z = 0.6;
  parts.mesh(
    cg10mMovementCoverGeometry(),
    new MeshPhysicalMaterial({
      color: 0x02_03_04,
      roughness: 0.32,
      specularIntensity: 0.25,
      envMapIntensity: 0.35,
    }),
    [0, y, front - 5.05],
    "Rounded black cover over the meter movement"
  );
  const legend = parts.print(
    24,
    10,
    [0, y - 5, front - 4.6],
    (context) => {
      context.font = "2.2px Arial";
      context.fillStyle = "#7e8a95";
      context.textAlign = "center";
      context.fillText("OVEN", 12, 5.8);
    },
    "OVEN lettering beneath the meter glass",
    512
  );
  legend.material.transparent = false;
  legend.material.alphaTest = 0.3;
  legend.material.depthWrite = true;
  const lens = parts.lathe(
    [
      [0, -0.08],
      [8.4, -0.12],
      [12.6, -0.2],
      [radius, -0.4],
      [radius, -0.1],
      [16.6, 0],
      [12.6, 0.15],
      [8.4, 0.31],
      [4.2, 0.42],
      [0, 0.45],
    ],
    [0, y, front + lensDepth],
    new MeshPhysicalMaterial({
      color: 0xff_ff_ff,
      transmission: 1,
      thickness: 0.55,
      ior: 1.5,
      roughness: 0.015,
      attenuationColor: 0xe6_f2_ff,
      attenuationDistance: 100,
      envMapIntensity: 0.5,
    }),
    "Convex meter glass with physical transmission and refraction"
  );
  lens.userData["castShadow"] = false;
}
