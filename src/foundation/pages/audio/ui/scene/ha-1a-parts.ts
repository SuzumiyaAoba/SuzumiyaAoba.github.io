import {
  CanvasTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from "three";
import { createModelParts } from "./parts";

function finishTexture(wood: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the Cayin enclosure finish.");
  }
  if (wood) {
    const pixels = context.createImageData(1024, 512);
    for (let y = 0; y < 512; y += 1) {
      for (let x = 0; x < 1024; x += 1) {
        const knot =
          Math.exp(-(((x - 640) / 260) ** 2)) * Math.sin(y * 0.016) * 48;
        const grain =
          y +
          Math.sin(x * 0.005) * 18 +
          Math.sin(x * 0.014 + y * 0.006) * 5 +
          knot;
        const shade =
          Math.sin(grain * 0.17) * 11 +
          Math.sin(grain * 0.72) * 3 +
          Math.sin(grain * 2.4) * 1.4 +
          Math.sin(x * 0.008 + y * 0.012) * 7;
        const index = (y * 1024 + x) * 4;
        pixels.data[index] = 119 + shade;
        pixels.data[index + 1] = 45 + shade * 0.55;
        pixels.data[index + 2] = 19 + shade * 0.3;
        pixels.data[index + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
  } else {
    context.fillStyle = "#dedede";
    context.fillRect(0, 0, 1024, 512);
    for (let column = 0; column < 1024; column += 1) {
      const shade = 188 + ((column * 73) % 55);
      context.fillStyle = `rgb(${shade} ${shade} ${shade} / 0.5)`;
      context.fillRect(column, 0, 0.6, 512);
    }
  }
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
  const woodTexture = finishTexture(true);
  const aluminiumTexture = finishTexture(false);
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
    clearcoat: 1,
    clearcoatRoughness: 0.17,
  });
  const aluminium = new MeshPhysicalMaterial({
    color: 0xd0_d2_d4,
    map: aluminiumTexture,
    bumpMap: aluminiumTexture,
    bumpScale: 0.06,
    metalness: 0.86,
    roughness: 0.34,
  });
  const charcoal = new MeshStandardMaterial({
    color: 0x23_24_26,
    metalness: 0.45,
    roughness: 0.64,
  });
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
  const glow = new MeshBasicMaterial({ color: 0xff_53_09, toneMapped: false });
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
      aluminiumTexture.dispose();
      faceTextures.anisotropy.dispose();
      faceTextures.bump.dispose();
    },
  };
}

export type Ha1aParts = ReturnType<typeof createHa1aParts>;
