import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";
import { ie600ZirconiumMaterial } from "./ie-600-material";
import { ie600EngravingTexture, ie600GrainTexture } from "./ie-600-textures";

export function createIe600Parts() {
  const parts = createModelParts();
  const grain = ie600GrainTexture();
  const leftFront = ie600EngravingTexture(-1, false);
  const leftRear = ie600EngravingTexture(-1, true);
  const rightFront = ie600EngravingTexture(1, false);
  const rightRear = ie600EngravingTexture(1, true);
  const zirconium = ie600ZirconiumMaterial(grain, rightFront, rightRear, false);
  const leftHousing = ie600ZirconiumMaterial(grain, leftFront, leftRear, true);
  const rightHousing = ie600ZirconiumMaterial(
    grain,
    rightFront,
    rightRear,
    true
  );
  const silicone = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x18_19_1a,
      roughness: 0.68,
      specularIntensity: 0.32,
      clearcoat: 0.08,
      clearcoatRoughness: 0.85,
    }),
    { scale: [18, 18, 18], relief: 0.0025, roughness: 0.06 }
  );
  const connectorRubber = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x13_15_17,
      roughness: 0.57,
      specularIntensity: 0.42,
    }),
    { scale: [9, 9, 9], relief: 0.004, roughness: 0.08 }
  );
  const connectorGold = new MeshPhysicalMaterial({
    color: 0xd5_b7_5e,
    metalness: 1,
    roughness: 0.22,
    anisotropy: 0.2,
    envMapIntensity: 1.25,
  });
  const contactInsulator = new MeshStandardMaterial({
    color: 0xc5_c1_b2,
    roughness: 0.68,
  });
  const cableJacket = new MeshPhysicalMaterial({
    color: 0x3f_47_41,
    roughness: 0.55,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const cableCore = new MeshStandardMaterial({
    color: 0x37_3d_39,
    metalness: 0.35,
    roughness: 0.53,
  });
  const wire = new MeshStandardMaterial({
    color: 0x4d_55_4d,
    metalness: 0.15,
    roughness: 0.8,
  });
  const rightMarker = new MeshStandardMaterial({
    color: 0x94_28_2e,
    roughness: 0.55,
  });
  return {
    ...parts,
    zirconium,
    leftHousing,
    rightHousing,
    silicone,
    connectorRubber,
    connectorGold,
    contactInsulator,
    cableJacket,
    cableCore,
    wire,
    rightMarker,
    dispose() {
      parts.dispose();
      for (const texture of [
        grain,
        leftFront,
        leftRear,
        rightFront,
        rightRear,
      ]) {
        texture.dispose();
      }
    },
  };
}

export type Ie600Parts = ReturnType<typeof createIe600Parts>;
