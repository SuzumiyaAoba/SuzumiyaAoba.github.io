import { BoxGeometry, PlaneGeometry } from "three";
import { expect, it } from "vite-plus/test";
import { indexAudioGeometry } from "./index-geometry";

it("三角形の順序・法線・UV の継ぎ目・材質グループを頂点共有後も再現する", () => {
  const box = new BoxGeometry(3, 7, 5, 3, 3, 3);
  const geometry = box.toNonIndexed();
  const original = geometry.clone();
  indexAudioGeometry(geometry);
  expect(geometry.index?.array).toBeInstanceOf(Uint16Array);
  expect(geometry.getAttribute("position").count).toBeLessThan(
    original.getAttribute("position").count
  );
  const expanded = geometry.toNonIndexed();
  for (const [name, attribute] of Object.entries(original.attributes)) {
    expect(expanded.getAttribute(name).array).toStrictEqual(attribute.array);
  }
  expect(geometry.groups).toStrictEqual(original.groups);
  for (const item of [box, original, geometry, expanded]) {
    item.dispose();
  }
});

it("6万5535頂点を超える部品は32ビットの索引で端まで描く", () => {
  const plane = new PlaneGeometry(1, 1, 256, 256);
  const geometry = plane.toNonIndexed();
  indexAudioGeometry(geometry);
  expect(geometry.index?.array).toBeInstanceOf(Uint32Array);
  expect(geometry.getAttribute("position").count).toBe(257 ** 2);
  expect(geometry.index?.count).toBe(plane.index?.count);
  const expanded = geometry.toNonIndexed();
  const position = expanded.getAttribute("position");
  expect(position.getX(position.count - 1)).toBe(0.5);
  for (const item of [plane, geometry, expanded]) {
    item.dispose();
  }
});
