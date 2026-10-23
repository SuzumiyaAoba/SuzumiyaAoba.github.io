import { ExtrudeGeometry, Shape, Vector2 } from "three";
import outlines from "./focal-emblem-shapes.json";

/** Focal 公式 SVG の輪郭を保持した、メッシュ上の薄い金属エンブレム。
 * Source: https://www.focal.com/products/clear-mg-professional
 */
export function focalEmblemGeometry() {
  const shapes = outlines.map((outline) =>
    new Shape().fromJSON({
      ...outline,
      currentPoint: new Vector2().fromArray(outline.currentPoint).toArray(),
      holes: [],
    })
  );
  const geometry = new ExtrudeGeometry(shapes, {
    depth: 0.7,
    bevelEnabled: true,
    bevelSize: 0.3,
    bevelThickness: 0.3,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geometry.scale(0.34, -0.34, 0.34);
  geometry.translate(-59.95 * 0.34, 62.85 * 0.34, 0);
  for (const attribute of Object.values(geometry.attributes)) {
    for (let vertex = 0; vertex < attribute.count; vertex += 3) {
      for (let component = 0; component < attribute.itemSize; component += 1) {
        const value = attribute.getComponent(vertex + 1, component);
        attribute.setComponent(
          vertex + 1,
          component,
          attribute.getComponent(vertex + 2, component)
        );
        attribute.setComponent(vertex + 2, component, value);
      }
    }
  }
  return geometry;
}
