import {
  CanvasTexture,
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
} from "three";
import type { Material } from "three";
import { createModelParts } from "./parts";

export function roundedOutline(width: number, height: number, radius: number) {
  const x = width / 2;
  const y = height / 2;
  const shape = new Shape();
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);
  shape.closePath();
  return shape;
}

function satinGrain() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the NODE satin finish.");
  }
  const pixels = context.createImageData(256, 256);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const shade = 112 + ((index * 13 + Math.floor(index / 1024) * 47) % 31);
    pixels.data[index] = shade;
    pixels.data[index + 1] = shade;
    pixels.data[index + 2] = shade;
    pixels.data[index + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  return new CanvasTexture(canvas);
}

export function createNodeParts() {
  const parts = createModelParts();
  const grain = satinGrain();
  const matte = new MeshPhysicalMaterial({
    color: 0x12_13_14,
    roughness: 0.68,
    specularIntensity: 0.3,
    envMapIntensity: 0.45,
    bumpMap: grain,
    bumpScale: 0.015,
  });
  const trim = new MeshStandardMaterial({
    color: 0x23_25_27,
    metalness: 0.35,
    roughness: 0.45,
  });
  const screen = new MeshPhysicalMaterial({
    color: 0x01_02_03,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.5,
    specularIntensity: 0.25,
    clearcoatRoughness: 0.07,
    envMapIntensity: 0.18,
  });
  const signal = new MeshBasicMaterial({
    color: 0x16_32_ff,
    toneMapped: false,
  });
  const whiteLed = new MeshBasicMaterial({
    color: 0xdd_e2_e8,
    toneMapped: false,
  });
  return {
    ...parts,
    matte,
    trim,
    screen,
    signal,
    whiteLed,
    dispose() {
      parts.dispose();
      grain.dispose();
    },
  };
}

export type NodeParts = ReturnType<typeof createNodeParts>;

export function horizontalPlate(
  parts: NodeParts,
  outline: Shape,
  height: number,
  y: number,
  material: Material,
  name: string,
  bevel = 0.15
) {
  const geometry = new ExtrudeGeometry(outline, {
    depth: height,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 4,
    curveSegments: 32,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(index, positions.getX(index) / 220, positions.getY(index) / 146);
  }
  const part = parts.mesh(geometry, material, [0, y, 0], name);
  part.rotation.x = -Math.PI / 2;
  return part;
}
