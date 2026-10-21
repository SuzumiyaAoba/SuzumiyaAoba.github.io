import {
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from "three";
import { createPreparedTexture } from "./prepared-textures";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";

export function createHa1aParts() {
  const parts = createModelParts();
  const woodTexture = createPreparedTexture("ha-wood", true);
  const faceTextures = {
    anisotropy: createPreparedTexture("ha-dial-anisotropy"),
    bump: createPreparedTexture("ha-dial-bump"),
  };
  const knobFace = new MeshPhysicalMaterial({
    color: 0xc3_c5_c8,
    metalness: 1,
    roughness: 0.28,
    anisotropy: 0.8,
    anisotropyMap: faceTextures.anisotropy,
    bumpMap: faceTextures.bump,
    bumpScale: 0.012,
  });
  const wood = new MeshPhysicalMaterial({
    map: woodTexture,
    bumpMap: woodTexture,
    bumpScale: 0.12,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    ior: 1.45,
  });
  const aluminium = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0xd0_d2_d4,
      metalness: 0.86,
      roughness: 0.34,
    }),
    { scale: [8, 0.08, 8], relief: 0.022, roughness: 0.13 }
  );
  const charcoal = applySurfaceFinish(
    new MeshStandardMaterial({
      color: 0x23_24_26,
      metalness: 0.45,
      roughness: 0.64,
    }),
    { relief: 0.018, roughness: 0.12 }
  );
  const tubeGlass = new MeshPhysicalMaterial({
    color: 0xe7_ec_ef,
    transparent: true,
    opacity: 0.15,
    roughness: 0.08,
    metalness: 0.05,
    clearcoat: 1,
    side: DoubleSide,
    depthWrite: false,
  });
  const windowGlass = new MeshPhysicalMaterial({
    color: 0xb7_c6_d0,
    transparent: true,
    opacity: 0.08,
    roughness: 0.07,
    metalness: 0.15,
    clearcoat: 1,
    depthWrite: false,
  });
  const glow = new MeshStandardMaterial({
    color: 0x4a_16_07,
    emissive: 0xff_49_07,
    emissiveIntensity: 0.6,
    roughness: 0.65,
  });
  const filament = new MeshBasicMaterial({
    color: 0xff_b6_42,
    toneMapped: false,
  });
  return {
    ...parts,
    wood,
    aluminium,
    knobFace,
    charcoal,
    tubeGlass,
    windowGlass,
    glow,
    filament,
    dispose() {
      parts.dispose();
      woodTexture.dispose();
      faceTextures.anisotropy.dispose();
      faceTextures.bump.dispose();
    },
  };
}

export type Ha1aParts = ReturnType<typeof createHa1aParts>;
