import {
  BufferAttribute,
  Color,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from "three";
import { clamp, fbm2, terrainColor } from "./kit";

/** 侵食デモ用の高さマップ（N×N、値はおおよそ 0〜1）。 */
export function initialHeights(
  size: number,
  kind: "hills" | "cliffs",
  seed = 0
) {
  const heights = new Float32Array(size * size);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const x = i / size;
      const z = j / size;
      const radial = Math.hypot(x - 0.5, z - 0.5);
      let h = 0;
      if (kind === "hills") {
        // なだらかな山：大きな起伏 + 細かな凹凸
        h = 0.8 - radial * 1.1 + fbm2(x * 3.2 + seed, z * 3.2 - seed, 6) * 0.6;
      } else {
        // 段々の崖：高さを量子化して急な段差を作る
        const base =
          0.72 - radial * 0.9 + fbm2(x * 2.4 + seed, z * 2.4, 4) * 0.7;
        const steps = 6;
        const level = Math.floor(base * steps) / steps;
        const t = base * steps - Math.floor(base * steps);
        h =
          level +
          (t > 0.85 ? (t - 0.85) / 0.15 / steps : 0) +
          fbm2(x * 14, z * 14, 2) * 0.015;
      }
      heights[j * size + i] = clamp(h, 0.02, 1);
    }
  }
  return heights;
}

/**
 * 高さマップをそのまま頂点に写す地形メッシュ。
 * mode = "terrain" は標高で色分け、"change" は元の地形から削れた所を赤、たまった所を青にする。
 */
export function erosionTerrain(
  size: number,
  width: number,
  heightScale: number
) {
  const geometry = new PlaneGeometry(width, width, size - 1, size - 1);
  geometry.rotateX(-Math.PI / 2);
  const colors = new Float32Array(size * size * 3);
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0,
    })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const color = new Color();
  const eroded = new Color("#e0584f");
  const deposited = new Color("#4f8fe0");
  const neutral = new Color("#b9b2a6");
  const update = (
    heights: Float32Array,
    initial: Float32Array,
    mode: string,
    highlight?: Uint8Array
  ) => {
    const position = geometry.getAttribute("position");
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const index = j * size + i;
        const h = heights[index] ?? 0;
        position.setY(index, h * heightScale);
        if (mode === "change") {
          const change = h - (initial[index] ?? 0);
          color
            .copy(neutral)
            .lerp(
              change < 0 ? eroded : deposited,
              clamp(Math.abs(change) * 60)
            );
        } else {
          const left = heights[j * size + Math.max(0, i - 1)] ?? h;
          const right = heights[j * size + Math.min(size - 1, i + 1)] ?? h;
          const up = heights[Math.max(0, j - 1) * size + i] ?? h;
          const down = heights[Math.min(size - 1, j + 1) * size + i] ?? h;
          const cell = width / (size - 1);
          const slope =
            (Math.hypot(right - left, down - up) * heightScale) / (2 * cell);
          terrainColor(h * 0.95 + 0.05, clamp(slope * 0.8), color);
        }
        if (highlight?.[index] === 1) {
          color.lerp(eroded, 0.85);
        }
        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;
      }
    }
    position.needsUpdate = true;
    const colorAttribute = geometry.getAttribute("color");
    colorAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  };
  return Object.assign(mesh, { update });
}
