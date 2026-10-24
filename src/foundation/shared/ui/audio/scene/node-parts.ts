import {
  DoubleSide,
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
} from "three";
import type { Material } from "three";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";
import { createDetailLevels } from "./detail-levels";

export function roundedOutline(width: number, height: number, radius: number) {
  const x = width / 2;
  const y = height / 2;
  const shape = new Shape();
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.absarc(x - radius, -y + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x, y - radius);
  shape.absarc(x - radius, y - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(-x + radius, y);
  shape.absarc(-x + radius, y - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(-x, -y + radius);
  shape.absarc(-x + radius, -y + radius, radius, Math.PI, Math.PI * 1.5, false);
  shape.closePath();
  return shape;
}

export function createNodeParts() {
  const parts = createModelParts();
  const detail = createDetailLevels();
  const matte = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x20_21_23,
      roughness: 0.68,
      specularIntensity: 0.35,
      envMapIntensity: 0.65,
      shadowSide: DoubleSide,
    }),
    { scale: [15, 15, 15], relief: 0.004, roughness: 0.06 }
  );
  const waist = new MeshPhysicalMaterial({
    color: 0x05_06_07,
    roughness: 0.6,
    clearcoat: 0.1,
    specularIntensity: 0.2,
    envMapIntensity: 0.35,
    shadowSide: DoubleSide,
  });
  const panel = new MeshPhysicalMaterial({
    color: 0x0c_0d_0f,
    roughness: 0.36,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
  });
  const connectorMetal = applySurfaceFinish(
    new MeshStandardMaterial({
      color: 0xb1_b4_b7,
      metalness: 1,
      roughness: 0.24,
    }),
    { relief: 0.002, roughness: 0.04 }
  );
  const gold = new MeshStandardMaterial({
    color: 0xd9_bb_70,
    metalness: 1,
    roughness: 0.23,
  });
  const ventMetal = applySurfaceFinish(
    new MeshStandardMaterial({
      color: 0x34_38_3d,
      metalness: 0.55,
      roughness: 0.55,
      envMapIntensity: 0.65,
    }),
    { relief: 0.003, roughness: 0.04 }
  );
  const trim = new MeshStandardMaterial({
    color: 0x23_25_27,
    metalness: 0.35,
    roughness: 0.45,
  });
  const screen = new MeshPhysicalMaterial({
    color: 0x01_02_03,
    roughness: 0.09,
    metalness: 0,
    clearcoat: 0.15,
    specularIntensity: 0.1,
    clearcoatRoughness: 0.07,
    envMapIntensity: 0.06,
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
    detail,
    matte,
    waist,
    panel,
    connectorMetal,
    gold,
    ventMetal,
    trim,
    screen,
    signal,
    whiteLed,
    dispose() {
      detail.dispose();
      parts.dispose();
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
