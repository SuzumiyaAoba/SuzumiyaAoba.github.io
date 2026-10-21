import { ExtrudeGeometry, Matrix4, Shape } from "three";
import { horizontalPlate, roundedOutline } from "./node-parts";
import type { NodeParts } from "./node-parts";

function roundedDistance(
  x: number,
  z: number,
  width: number,
  depth: number,
  radius: number
) {
  const dx = Math.abs(x) - width / 2 + radius;
  const dz = Math.abs(z) - depth / 2 + radius;
  return (
    Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) +
    Math.min(Math.max(dx, dz), 0) -
    radius
  );
}

function perforatedSurround(parts: NodeParts) {
  const hexagon = new Shape();
  const opening = new Shape();
  for (let index = 0; index < 6; index += 1) {
    const angle = (index * Math.PI) / 3;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    if (index === 0) {
      hexagon.moveTo(x * 1.3, y * 1.3);
      opening.moveTo(x * 0.97, y * 0.97);
    } else {
      hexagon.lineTo(x * 1.3, y * 1.3);
      opening.lineTo(x * 0.97, y * 0.97);
    }
  }
  hexagon.closePath();
  opening.closePath();
  hexagon.holes.push(opening);
  const cells: [number, number][] = [];
  for (let row = 0; row < 34; row += 1) {
    const z = (row - 16.5) * Math.sqrt(3) * 1.3;
    for (let column = 0; column < 74; column += 1) {
      const x = (column - 36.5) * 1.95;
      const offsetZ = z + (column % 2 === 0 ? 0 : Math.sqrt(3) * 0.65);
      const insideOuter = roundedDistance(x, offsetZ, 144, 76, 8) < -1.25;
      const outsideGlass = roundedDistance(x, offsetZ, 132.5, 62.5, 5) > 0.6;
      if (insideOuter && outsideGlass) {
        cells.push([x, offsetZ]);
      }
    }
  }
  const grille = parts.instanced(
    new ExtrudeGeometry(hexagon, { depth: 0.28, bevelEnabled: false }),
    parts.trim,
    cells.length,
    "Individual hexagonal perforations around the touch panel"
  );
  const matrix = new Matrix4();
  for (const [index, [x, z]] of cells.entries()) {
    matrix.makeRotationX(-Math.PI / 2);
    matrix.setPosition(x, 44.98, z);
    grille.setMatrixAt(index, matrix);
  }
  grille.instanceMatrix.needsUpdate = true;
  grille.computeBoundingSphere();
}

function touchLights(parts: NodeParts) {
  const glow = parts.print(
    133,
    63,
    [0, 45.58, 0],
    (context) => {
      const spot = (x: number, y: number, color: string) => {
        const gradient = context.createRadialGradient(x, y, 0, x, y, 3.5);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");
        context.fillStyle = gradient;
        context.fillRect(x - 3.5, y - 3.5, 7, 7);
      };
      for (const x of [-50, -25, 0, 25, 50]) {
        spot(x + 66.5, 11.5, "rgb(220 230 255 / 0.18)");
      }
      for (const x of [16.5, 116.5]) {
        spot(x, 29.5, "rgb(220 230 255 / 0.18)");
        spot(x, 50.5, "rgb(220 230 255 / 0.15)");
      }
      spot(66.5, 50.5, "rgb(20 50 255 / 0.38)");
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
      0.72,
      [x, 45.61, -20],
      parts.whiteLed,
      "Illuminated preset touch point"
    );
    preset.rotation.x = -Math.PI / 2;
  }
  for (const x of [-50, 50]) {
    const volume = parts.disc(
      0.65,
      [x, 45.61, -2],
      parts.whiteLed,
      "Volume touch point"
    );
    volume.rotation.x = -Math.PI / 2;
  }
  parts.box(
    [82, 0.12, 0.65],
    [0, 45.61, -2],
    parts.whiteLed,
    "Illuminated volume touch slider",
    0.06
  );
  const play = parts.ring(
    2.25,
    0.25,
    [0, 45.63, 19],
    parts.signal,
    "Blue play/pause touch ring"
  );
  play.rotation.x = -Math.PI / 2;
}

export function createNodeTop(parts: NodeParts) {
  horizontalPlate(
    parts,
    roundedOutline(144.5, 76.5, 8),
    0.4,
    44.48,
    parts.cavity,
    "Recessed touch-panel pocket",
    0.1
  );
  perforatedSurround(parts);
  horizontalPlate(
    parts,
    roundedOutline(133, 63, 5),
    0.55,
    44.9,
    parts.screen,
    "Gloss black capacitive touch glass",
    0.12
  );
  touchLights(parts);
}
