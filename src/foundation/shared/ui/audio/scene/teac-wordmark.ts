import { ExtrudeGeometry, Shape, Vector2 } from "three";
import type { ModelParts, Position } from "./parts";
import outlines from "./teac-logo-shapes.json";

/** TEAC 公開 SVG の輪郭を保持した、浅い金属製ワードマーク。
 * Source: https://teac.jp/assets/img/web_logo/teac_logo_blue.svg
 */
export function createTeacWordmark(parts: ModelParts, position: Position) {
  const finish = parts.silver.clone();
  finish.color.setHex(0xc0_c2_c4);
  finish.metalness = 0.6;
  finish.roughness = 0.35;
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
  const geometry = new ExtrudeGeometry(shapes, {
    depth: 1.1,
    bevelEnabled: true,
    bevelSize: 0.25,
    bevelThickness: 0.25,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geometry.scale(24 / 285, -24 / 285, 0.09);
  geometry.translate(-12, (57.813 * 12) / 285, 0);
  // 上下反転の後に表裏もそろえる。
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const uvs = geometry.getAttribute("uv");
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    for (const attribute of [positions, normals, uvs]) {
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
  return parts.mesh(
    geometry,
    finish,
    position,
    "Embossed TEAC metal wordmark with original letter outlines"
  );
}
