import { MeshStandardMaterial, Shape, ShapeGeometry, Vector2 } from "three";
import type { ModelParts, Position } from "./parts";
import outlines from "./cayin-logo-shapes.json";

/** 正規代理店の SVG 輪郭を、前板の細いシルク印刷として再現する。
 * Source: https://kopek.jp/wp-content/uploads/2026/07/cayin-logo-t.svg
 */
export function createCayinWordmark(parts: ModelParts, position: Position) {
  const shapes = outlines.map((outline) =>
    new Shape().fromJSON({
      ...outline,
      currentPoint: new Vector2().fromArray(outline.currentPoint).toArray(),
      holes: outline.holes.map((hole) => ({
        ...hole,
        currentPoint: new Vector2().fromArray(hole.currentPoint).toArray(),
      })),
    })
  );
  const geometry = new ShapeGeometry(shapes, 16);
  geometry.scale(0.42, -0.42, 1);
  geometry.translate(-51.2 * 0.42, 13.3 * 0.42, 0);
  const { index } = geometry;
  if (index) {
    for (let vertex = 0; vertex < index.count; vertex += 3) {
      const second = index.getX(vertex + 1);
      index.setX(vertex + 1, index.getX(vertex + 2));
      index.setX(vertex + 2, second);
    }
  }
  const ink = new MeshStandardMaterial({
    color: 0x2b_2b_2c,
    roughness: 0.8,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const print = parts.mesh(
    geometry,
    ink,
    position,
    "Cayin silk-screen wordmark with original cursive contours"
  );
  print.userData["castShadow"] = false;
}
