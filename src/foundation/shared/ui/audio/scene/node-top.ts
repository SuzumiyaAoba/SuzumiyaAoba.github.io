import { BufferGeometry, Float32BufferAttribute } from "three";
import { horizontalPlate, roundedOutline } from "./node-parts";
import type { NodeParts } from "./node-parts";
import { nodeVentGeometry } from "./node-geometry";

// 天板からガラスまでの落ち込み。黒い縁は斜めから見たときに特に目立つ。
const glassY = 43.65;

function pocketWall() {
  const positions: number[] = [];
  const indices: number[] = [];
  let previous = -1;
  for (const [inset, y] of [
    [0, 46],
    [0.35, 45.85],
    [1.05, 45.05],
    [1.1, glassY - 0.6],
  ] as const) {
    const loop = roundedOutline(
      145.8 - 2 * inset,
      77.8 - 2 * inset,
      8.7 - inset
    ).getPoints(16);
    const start = positions.length / 3;
    for (const [index, point] of loop.entries()) {
      positions.push(point.x, y, -point.y);
      if (previous >= 0 && index > 0) {
        const a = previous + index;
        const b = start + index;
        indices.push(a - 1, a, b - 1, a, b, b - 1);
      }
    }
    previous = start;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function perforatedSurround(parts: NodeParts) {
  const grille = parts.detail.add(
    parts.mesh(
      nodeVentGeometry({ detailed: false }),
      parts.ventMetal,
      [0, glassY - 0.8, 0],
      "Continuous perforated touch-panel ventilation surround"
    ),
    {
      radius: 82,
      pixels: 480,
      build: () => nodeVentGeometry(),
    }
  );
  grille.rotation.x = -Math.PI / 2;
  const gasket = roundedOutline(133.4, 63.9, 5.4);
  gasket.holes.push(roundedOutline(131.6, 62.1, 4.8));
  horizontalPlate(
    parts,
    gasket,
    0.35,
    glassY - 0.53,
    parts.trim,
    "Raised inner bead around the touch glass",
    0.12
  );
}

function touchLights(parts: NodeParts) {
  const glow = parts.print(
    133,
    63,
    [0, glassY + 0.04, 0],
    (context) => {
      const spot = (x: number, y: number, color: string) => {
        const gradient = context.createRadialGradient(x, y, 0, x, y, 3.5);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");
        context.fillStyle = gradient;
        context.fillRect(x - 3.5, y - 3.5, 7, 7);
      };
      for (const x of [-50, -25, 0, 25, 50]) {
        spot(x + 66.5, 11.5, "rgb(220 230 255 / 0.23)");
      }
      for (const x of [16.5, 116.5]) {
        spot(x, 29.5, "rgb(220 230 255 / 0.18)");
        spot(x, 50.5, "rgb(220 230 255 / 0.15)");
      }
      spot(66.5, 50.5, "rgb(20 50 255 / 0.55)");
      context.strokeStyle = "rgb(220 230 255 / 0.12)";
      context.lineWidth = 2.2;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(25.5, 29.5);
      context.lineTo(107.5, 29.5);
      context.stroke();
      context.strokeStyle = "#dce4ef";
      context.lineWidth = 1.05;
      context.lineJoin = "round";
      for (const [x, direction] of [
        [16.5, -1],
        [116.5, 1],
      ] as const) {
        context.beginPath();
        context.moveTo(x - direction * 1.4, 48.3);
        context.lineTo(x + direction * 1.4, 50.5);
        context.lineTo(x - direction * 1.4, 52.7);
        context.stroke();
      }
    },
    "Static illuminated skip controls and gentle LED diffusion",
    1024,
    true
  );
  glow.rotation.x = -Math.PI / 2;
  for (const x of [-50, -25, 0, 25, 50]) {
    const preset = parts.disc(
      0.9,
      [x, glassY + 0.07, -20],
      parts.whiteLed,
      "Illuminated preset touch point"
    );
    preset.rotation.x = -Math.PI / 2;
  }
  for (const x of [-50, 50]) {
    const volume = parts.disc(
      0.85,
      [x, glassY + 0.07, -2],
      parts.whiteLed,
      "Volume touch point"
    );
    volume.rotation.x = -Math.PI / 2;
  }
  const slider = horizontalPlate(
    parts,
    roundedOutline(82, 0.72, 0.36),
    0.05,
    glassY + 0.07,
    parts.whiteLed,
    "Illuminated volume touch slider",
    0.01
  );
  slider.position.z = -2;
  const play = parts.ring(
    2.25,
    0.33,
    [0, glassY + 0.09, 19],
    parts.signal,
    "Blue play/pause touch ring"
  );
  play.rotation.x = -Math.PI / 2;
}

export function createNodeTop(parts: NodeParts) {
  parts.mesh(
    pocketWall(),
    parts.matte,
    [0, 0, 0],
    "Rolled rim descending into the touch-panel pocket"
  );
  horizontalPlate(
    parts,
    roundedOutline(144.5, 76.5, 8),
    0.4,
    glassY - 1.7,
    parts.cavity,
    "Recessed touch-panel pocket",
    0.1
  );
  perforatedSurround(parts);
  horizontalPlate(
    parts,
    roundedOutline(131.8, 62.3, 4.8),
    0.55,
    glassY - 0.67,
    parts.screen,
    "Gloss black capacitive touch glass",
    0.12
  );
  touchLights(parts);
}
