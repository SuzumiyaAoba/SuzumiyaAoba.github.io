import {
  CanvasTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from "three";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";

function woodFinishTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the Cayin wood finish.");
  }
  const pixels = context.createImageData(1024, 512);
  for (let y = 0; y < 512; y += 1) {
    for (let x = 0; x < 1024; x += 1) {
      const knot = Math.exp(-(((x - 700) / 155) ** 2 + ((y - 355) / 85) ** 2));
      const flow =
        y +
        Math.sin(x * 0.006) * 3 +
        Math.sin(x * 0.017 + y * 0.008) * 0.8 +
        knot * 14;
      const latewood =
        ((Math.sin(flow * 1.6 + Math.sin(x * 0.01) * 0.6) + 1) / 2) ** 12;
      const fibers = Math.sin(flow * 6.1 + Math.sin(x * 0.1)) * 1.4;
      const shade =
        Math.sin(flow * 0.19) * 3.2 -
        latewood * 18 +
        fibers +
        Math.sin(x * 0.007 + y * 0.011) * 6;
      const index = (y * 1024 + x) * 4;
      pixels.data[index] = 119 + shade;
      pixels.data[index + 1] = 43 + shade * 0.55;
      pixels.data[index + 2] = 17 + shade * 0.3;
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function knobFaceTextures() {
  const size = 512;
  const directions = document.createElement("canvas");
  const machining = document.createElement("canvas");
  directions.width = size;
  directions.height = size;
  machining.width = size;
  machining.height = size;
  const directionContext = directions.getContext("2d");
  const machiningContext = machining.getContext("2d");
  if (!directionContext || !machiningContext) {
    throw new Error("Cannot create the machined dial-face finish.");
  }
  const vectors = directionContext.createImageData(size, size);
  const grooves = machiningContext.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - size / 2;
      const dy = size / 2 - y - 0.5;
      const distance = Math.hypot(dx, dy);
      const index = (y * size + x) * 4;
      vectors.data[index] = (0.5 - (dy / distance) * 0.5) * 255;
      vectors.data[index + 1] = (0.5 + (dx / distance) * 0.5) * 255;
      vectors.data[index + 2] = 255;
      vectors.data[index + 3] = 255;
      const shade = 180 + Math.sin(distance * 2.3) * 24;
      grooves.data[index] = shade;
      grooves.data[index + 1] = shade;
      grooves.data[index + 2] = shade;
      grooves.data[index + 3] = 255;
    }
  }
  directionContext.putImageData(vectors, 0, 0);
  machiningContext.putImageData(grooves, 0, 0);
  const anisotropy = new CanvasTexture(directions);
  const bump = new CanvasTexture(machining);
  anisotropy.anisotropy = 8;
  bump.anisotropy = 8;
  return { anisotropy, bump };
}

export function createHa1aParts() {
  const parts = createModelParts();
  const woodTexture = woodFinishTexture();
  const faceTextures = knobFaceTextures();
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
