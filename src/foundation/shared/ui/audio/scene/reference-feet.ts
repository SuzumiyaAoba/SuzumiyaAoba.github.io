import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
} from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import type { ModelParts } from "./parts";

function footOutline() {
  const shape = new Shape();
  shape.absarc(0, 0, 20.15, 0, Math.PI * 2, false);
  const access = new Path();
  access.absarc(-9.5, 0, 3.5, 0, Math.PI * 2, true);
  shape.holes.push(access);
  return shape;
}

function lowerCupGeometry() {
  const source = new ExtrudeGeometry(footOutline(), {
    depth: 2.7,
    bevelEnabled: true,
    bevelSize: 0.35,
    bevelThickness: 0.35,
    bevelSegments: 5,
    curveSegments: 64,
  });
  const positions = source.getAttribute("position");
  const vertices: number[] = [];
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    if (
      [vertex, vertex + 1, vertex + 2].every(
        (index) => positions.getZ(index) < -0.3499
      )
    ) {
      continue;
    }
    vertices.push(vertex, vertex + 1, vertex + 2);
  }
  const geometry = new BufferGeometry();
  for (const [name, attribute] of Object.entries(source.attributes)) {
    const values: number[] = [];
    for (const vertex of vertices) {
      for (let component = 0; component < attribute.itemSize; component += 1) {
        values.push(attribute.getComponent(vertex, component));
      }
    }
    geometry.setAttribute(
      name,
      new Float32BufferAttribute(values, attribute.itemSize)
    );
  }
  source.dispose();
  return toCreasedNormals(geometry, Math.PI / 4);
}

/** 底面写真の工具穴と、分離した受け皿・一点支持ピンを再現する。 */
export function createReferenceFeet(parts: ModelParts) {
  const endFace = parts.turnedFace().clone();
  endFace.color.setHex(0xb9_b7_ae);
  endFace.roughness = 0.26;
  // 旋盤面は別メッシュで張るため、同じ位置の底面を残さない。
  const lowerGeometry = lowerCupGeometry();
  const faceGeometry = new ShapeGeometry(footOutline(), 64);
  const positions = faceGeometry.getAttribute("position");
  const uvs = faceGeometry.getAttribute("uv");
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    uvs.setXY(
      vertex,
      positions.getX(vertex) / 41 + 0.5,
      positions.getY(vertex) / 41 + 0.5
    );
  }
  for (const [x, z] of [
    [-104, 88],
    [104, 88],
    [0, -83],
  ] as const) {
    const upper = parts.lathe(
      [
        [0, 5],
        [19.8, 5],
        [20.5, 5.5],
        [20.5, 11.8],
        [19.8, 12.3],
        [0, 12.3],
      ],
      [x, 0, z],
      parts.footMetal,
      "Pin-point foot upper cup"
    );
    upper.rotation.x = 0;
    const lower = parts.mesh(
      lowerGeometry,
      parts.footMetal,
      [x, 0.35, z],
      "Pin-point foot lower cup with an offset tool-access bore"
    );
    lower.rotation.x = -Math.PI / 2;
    const face = parts.mesh(
      faceGeometry,
      endFace,
      [x, 0, z],
      "Concentric machined underside of the pin-point foot"
    );
    face.rotation.x = Math.PI / 2;
    const flange = parts.lathe(
      [
        [0, 3.4],
        [7.8, 3.4],
        [7.8, 4.5],
        [9, 4.5],
        [9, 4.8],
        [0, 4.8],
      ],
      [x, 0, z],
      parts.footMetal,
      "Pin-point support flange"
    );
    flange.rotation.x = 0;
    const spike = parts.lathe(
      [
        [0, 4.8],
        [2.3, 5.6],
        [2.3, 6],
        [0, 6],
      ],
      [x, 0, z],
      parts.turned,
      "Pin-point support spike"
    );
    spike.rotation.x = 0;
  }
}
