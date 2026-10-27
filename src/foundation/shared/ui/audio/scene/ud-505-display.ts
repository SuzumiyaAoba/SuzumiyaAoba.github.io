import {
  BufferGeometry,
  Float32BufferAttribute,
  MeshPhysicalMaterial,
} from "three";
import type { ModelParts } from "./parts";

function displaySurroundGeometry() {
  const profiles = [
    [70.9, 23.9, 3, -0.3],
    [70.6, 23.6, 2.9, 0],
    [69.8, 22.8, 2.8, -0.12],
    [65.8, 18.8, 1.8, -1.65],
    [65.4, 18.4, 1.6, -2],
    [65.4, 18.4, 1.6, -3.4],
  ] as const;
  const points: number[] = [];
  const indices: number[] = [];
  const cornerSegments = 16;
  const count = 4 * (cornerSegments + 1);
  for (const [width, height, radius, z] of profiles) {
    for (let corner = 0; corner < 4; corner += 1) {
      const cx = (corner === 0 || corner === 3 ? 1 : -1) * (width / 2 - radius);
      const cy = (corner < 2 ? 1 : -1) * (height / 2 - radius);
      for (let step = 0; step <= cornerSegments; step += 1) {
        const angle = ((corner + step / cornerSegments) * Math.PI) / 2;
        points.push(
          cx + Math.cos(angle) * radius,
          cy + Math.sin(angle) * radius,
          z
        );
      }
    }
  }
  for (let profile = 0; profile < profiles.length - 1; profile += 1) {
    for (let point = 0; point < count; point += 1) {
      const next = (point + 1) % count;
      const a = profile * count + point;
      const b = profile * count + next;
      const c = (profile + 1) * count + point;
      const d = (profile + 1) * count + next;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createUd505Display(parts: ModelParts) {
  const surround = new MeshPhysicalMaterial({
    color: 0xb8_bb_bd,
    metalness: 0.65,
    roughness: 0.5,
  });
  parts.mesh(
    displaySurroundGeometry(),
    surround,
    [25.5, 56.5, 115],
    "Recessed rounded OLED window surround"
  );
  parts.facePlate(
    [65.4, 18.4, 0.4],
    [25.5, 56.5, 112.65],
    parts.cavity,
    "Black OLED backplane",
    1.6
  );
  const display = parts.print(
    65.3,
    18.3,
    [25.5, 56.5, 112.9],
    (context) => {
      context.fillStyle = "#020405";
      context.fillRect(0, 0, 65.3, 18.3);
      context.fillStyle = "#7caeb1";
      context.font = "200 7.4px 'Helvetica Neue', Arial, sans-serif";
      context.fillText("USB", 9, 12);
      // 細い文字の上へサブピクセルの間隙を載せる。低解像度の記号にはしない。
      context.fillStyle = "#020405";
      for (let x = 8.9; x < 25; x += 0.19) {
        context.fillRect(x, 5, 0.026, 8);
      }
      for (let y = 5; y < 13; y += 0.19) {
        context.fillRect(8.9, y, 16.1, 0.026);
      }
    },
    "OLED dot-matrix input indication beneath the cover glass",
    2048,
    true
  );
  display.material.transparent = false;
  display.material.depthWrite = true;
  const glass = new MeshPhysicalMaterial({
    color: 0xff_ff_ff,
    metalness: 0,
    roughness: 0.06,
    transmission: 1,
    thickness: 0.45,
    ior: 1.5,
    attenuationColor: 0xb0_b7_bd,
    attenuationDistance: 15,
  });
  const cover = parts.facePlate(
    [65.3, 18.3, 0.45],
    [25.5, 56.5, 113.45],
    glass,
    "Recessed polished OLED cover glass",
    1.6
  );
  cover.userData["castShadow"] = false;
}
