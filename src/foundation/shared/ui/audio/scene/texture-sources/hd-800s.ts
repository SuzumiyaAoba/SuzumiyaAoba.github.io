import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { hd800sGrille, hd800sGrilleHoles } from "../hd-800s-grille";

const textureSize = 512;

function noiseSource(seed: number) {
  let state = seed;
  return () => {
    state = (state * 48_271) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}

function textureSurface() {
  const canvas = document.createElement("canvas");
  canvas.width = textureSize;
  canvas.height = textureSize;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the HD 800 S surface finish.");
  }
  return { canvas, context };
}

function finishTexture(canvas: HTMLCanvasElement, color = false) {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  if (color) {
    texture.colorSpace = SRGBColorSpace;
  }
  return texture;
}

function grayscale(
  context: CanvasRenderingContext2D,
  shadeAt: (x: number, y: number) => number
) {
  const pixels = context.createImageData(textureSize, textureSize);
  for (let y = 0; y < textureSize; y += 1) {
    for (let x = 0; x < textureSize; x += 1) {
      const index = (y * textureSize + x) * 4;
      const shade = shadeAt(x, y);
      pixels.data[index] = shade;
      pixels.data[index + 1] = shade;
      pixels.data[index + 2] = shade;
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
}

function microfiberFinish() {
  const random = noiseSource(800);
  const height = textureSurface();
  const color = textureSurface();
  const roughness = textureSurface();
  grayscale(height.context, () => 100 + random() * 60);
  grayscale(color.context, (x, y) => {
    const nap = Math.sin(x / 43) * Math.sin(y / 61) * 17;
    return 163 + nap + random() * 75;
  });
  grayscale(roughness.context, () => 225 + random() * 30);
  // Short fibers have independent directions; the repeat is seamless at normal viewing distances.
  for (let fiber = 0; fiber < 18_000; fiber += 1) {
    const x = random() * textureSize;
    const y = random() * textureSize;
    const angle = random() * Math.PI * 2;
    const length = 1 + random() * 3;
    height.context.strokeStyle = `rgb(${160 + random() * 80} 160 160 / 0.55)`;
    height.context.lineWidth = 0.45 + random() * 0.5;
    height.context.beginPath();
    height.context.moveTo(x, y);
    height.context.lineTo(
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    height.context.stroke();
  }
  return {
    color: finishTexture(color.canvas, true),
    height: finishTexture(height.canvas),
    roughness: finishTexture(roughness.canvas),
  };
}

function metalFinish() {
  const random = noiseSource(300);
  const roughness = textureSurface();
  const rows = Array.from({ length: textureSize }, () => random());
  grayscale(roughness.context, (_x, y) => 209 + (rows[y] ?? 0) * 16);
  return {
    roughness: finishTexture(roughness.canvas),
  };
}

function powderFinish() {
  const random = noiseSource(505);
  const height = textureSurface();
  const roughness = textureSurface();
  grayscale(height.context, () => 112 + random() * 40);
  grayscale(roughness.context, () => 184 + random() * 60);
  return {
    height: finishTexture(height.canvas),
    roughness: finishTexture(roughness.canvas),
  };
}

function acousticCloth() {
  const surface = textureSurface();
  surface.context.fillStyle = "#000000";
  surface.context.fillRect(0, 0, textureSize, textureSize);
  surface.context.strokeStyle = "#e4e4e4";
  surface.context.lineWidth = 2.1;
  for (let offset = 4; offset <= textureSize; offset += 8) {
    surface.context.beginPath();
    surface.context.moveTo(offset, 0);
    surface.context.lineTo(offset, textureSize);
    surface.context.moveTo(0, offset);
    surface.context.lineTo(textureSize, offset);
    surface.context.stroke();
  }
  return finishTexture(surface.canvas);
}

/** 0.22 mm ピッチの織金網。色ではなく開口と線材の高さを別々に描く。 */
function steelMeshFinish() {
  const aperture = textureSurface();
  const height = textureSurface();
  const pitch = 16;
  const wireProfile = (coordinate: number, width: number) => {
    const distance = Math.abs((coordinate % pitch) - pitch / 2);
    return Math.sqrt(Math.max(0, 1 - (distance / width) ** 2));
  };
  grayscale(
    aperture.context,
    (x, y) =>
      Math.min(1, Math.max(wireProfile(x, 2.2), wireProfile(y, 0.85)) * 3) * 255
  );
  grayscale(height.context, (x, y) => {
    const crossing = (Math.floor(x / pitch) + Math.floor(y / pitch)) % 2;
    const warp = wireProfile(x, 2.2) * (crossing === 0 ? 1 : 0.75);
    const weft = wireProfile(y, 0.85) * (crossing === 1 ? 1 : 0.75);
    return Math.max(warp, weft) * 255;
  });
  const mask = finishTexture(aperture.canvas);
  const relief = finishTexture(height.canvas);
  for (const texture of [mask, relief]) {
    texture.repeat.set(100 / (32 * 0.22), 126 / (32 * 0.22));
  }
  return { mask, height: relief };
}

function grilleMask() {
  const surface = textureSurface();
  const { context } = surface;
  context.fillStyle = "#000000";
  context.fillRect(0, 0, textureSize, textureSize);
  context.translate(textureSize / 2, textureSize / 2);
  context.scale(textureSize / 57, -textureSize / 57);
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(0, 0, hd800sGrille.radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#000000";
  for (const { x, y } of hd800sGrilleHoles()) {
    context.beginPath();
    context.arc(x, y, hd800sGrille.hole + hd800sGrille.bevel, 0, Math.PI * 2);
    context.fill();
  }
  return finishTexture(surface.canvas);
}

export function createHd800sTextures() {
  const fabric = microfiberFinish();
  const metal = metalFinish();
  const powder = powderFinish();
  const cloth = acousticCloth();
  const mesh = steelMeshFinish();
  const grille = grilleMask();
  const textures = [
    ...Object.values(fabric),
    ...Object.values(metal),
    ...Object.values(powder),
    cloth,
    ...Object.values(mesh),
    grille,
  ];
  return {
    fabric,
    metal,
    powder,
    cloth,
    mesh,
    grille,
    dispose() {
      for (const texture of textures) {
        texture.dispose();
      }
    },
  };
}
