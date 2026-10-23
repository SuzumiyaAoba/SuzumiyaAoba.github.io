import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { createPreparedTexture } from "./prepared-textures";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";

export function createHa1aParts() {
  const parts = createModelParts({ brushed: false });
  const woodTexture = createPreparedTexture("ha-wood", true);
  const woodHeight = createPreparedTexture("ha-wood-height");
  const woodRoughness = createPreparedTexture("ha-wood-roughness");
  const faceTextures = {
    anisotropy: createPreparedTexture("ha-dial-anisotropy"),
    bump: createPreparedTexture("ha-dial-bump"),
  };
  const knobFace = new MeshPhysicalMaterial({
    color: 0xc3_c5_c8,
    metalness: 1,
    roughness: 0.34,
    anisotropy: 0.68,
    anisotropyMap: faceTextures.anisotropy,
    bumpMap: faceTextures.bump,
    bumpScale: 0.004,
  });
  const wood = new MeshPhysicalMaterial({
    map: woodTexture,
    bumpMap: woodHeight,
    bumpScale: 0.01,
    roughnessMap: woodRoughness,
    roughness: 0.7,
    clearcoat: 1,
    clearcoatRoughness: 0.105,
    ior: 1.45,
  });
  const aluminium = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0xd0_d2_d4,
      metalness: 0.86,
      roughness: 0.34,
    }),
    { scale: [12, 0.12, 12], relief: 0.0035, roughness: 0.065 }
  );
  const charcoal = applySurfaceFinish(
    new MeshStandardMaterial({
      color: 0x23_24_26,
      metalness: 0.45,
      roughness: 0.64,
    }),
    { scale: [15, 15, 15], relief: 0.003, roughness: 0.07 }
  );
  const tubeGlass = new MeshPhysicalMaterial({
    color: 0xff_ff_ff,
    roughness: 0.035,
    metalness: 0,
    transmission: 0.99,
    thickness: 0.45,
    ior: 1.47,
    attenuationColor: 0xe9_ee_e8,
    attenuationDistance: 35,
  });
  const windowGlass = new MeshPhysicalMaterial({
    color: 0xe2_e7_e9,
    transparent: true,
    opacity: 0.065,
    roughness: 0.025,
    metalness: 0,
    clearcoat: 1,
    depthWrite: false,
  });
  const filament = new MeshStandardMaterial({
    color: 0xff_b0_35,
    emissive: 0xff_59_0a,
    emissiveIntensity: 3,
    roughness: 0.65,
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
    filament,
    dispose() {
      parts.dispose();
      woodTexture.dispose();
      woodHeight.dispose();
      woodRoughness.dispose();
      faceTextures.anisotropy.dispose();
      faceTextures.bump.dispose();
    },
  };
}

export type Ha1aParts = ReturnType<typeof createHa1aParts>;
