import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  MathUtils,
  Path,
  Shape,
  Vector2,
} from "three";

export type CinnamonConnector = "usb-a" | "usb-b";

/** USB-A の長方形と USB-B の面取り形状を、中空の金属シェルにする。 */
export function cinnamonShieldGeometry(type: CinnamonConnector) {
  const outline: readonly (readonly [number, number])[] =
    type === "usb-a"
      ? [
          [-6, -2.25],
          [6, -2.25],
          [6, 2.25],
          [-6, 2.25],
        ]
      : [
          [-3.3, -3.4],
          [3.3, -3.4],
          [3.3, 1.5],
          [1.6, 3.2],
          [-1.6, 3.2],
          [-3.3, 1.5],
        ];
  const shape = new Shape(outline.map(([x, y]) => new Vector2(x, y)));
  shape.holes.push(
    new Path(outline.map(([x, y]) => new Vector2(x * 0.9, y * 0.82)))
  );
  return new ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false });
}

/** 写真から推定した丸い角と、赤いカバーから黒いブーツへ続く曲面。単位は mm。 */
export function cinnamonHousingGeometry(
  type: CinnamonConnector,
  section: "cover" | "boot"
) {
  const around = 48;
  const along = 16;
  const positions: number[] = [];
  const indices: number[] = [];
  const halfWidth = type === "usb-a" ? 8 : 5.6;
  const halfHeight = type === "usb-a" ? 4.4 : 6;
  for (let row = 0; row <= along; row += 1) {
    for (let column = 0; column <= around; column += 1) {
      const angle = (column / around) * Math.PI * 2;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      // 広い面の中央で赤いカバーを長くし、側面へ向かって斜めに切り上げる。
      const seam = 22 + 6 * Math.abs(sine) ** 4;
      const z =
        section === "cover"
          ? MathUtils.lerp(8, seam, row / along)
          : MathUtils.lerp(seam, 36, row / along);
      const taper = MathUtils.smoothstep(z, 16, 36);
      const width = MathUtils.lerp(halfWidth, 3.1, taper);
      const height = MathUtils.lerp(halfHeight, 3.1, taper);
      positions.push(
        Math.sign(cosine) * Math.abs(cosine) ** 0.35 * width,
        Math.sign(sine) * Math.abs(sine) ** 0.35 * height,
        z
      );
      if (row < along && column < around) {
        const first = row * (around + 1) + column;
        const next = first + around + 1;
        indices.push(first, first + 1, next, first + 1, next + 1, next);
      }
    }
  }
  // 端子の肩とケーブル出口だけを閉じ、カバーとブーツの境界は共有する。
  const capRow = section === "cover" ? 0 : along;
  const center = positions.length / 3;
  positions.push(0, 0, section === "cover" ? 8 : 36);
  for (let column = 0; column < around; column += 1) {
    const first = capRow * (around + 1) + column;
    if (section === "cover") {
      indices.push(center, first + 1, first);
    } else {
      indices.push(center, first, first + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
