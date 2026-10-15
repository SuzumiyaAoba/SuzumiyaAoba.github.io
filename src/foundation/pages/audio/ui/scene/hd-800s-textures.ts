import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

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
  const height = textureSurface();
  const roughness = textureSurface();
  const color = textureSurface();
  const rows = Array.from({ length: textureSize }, () => random());
  grayscale(height.context, (x, y) => {
    const groove = Math.cos(y * Math.PI) * 12;
    return (
      126 + groove + (rows[y] ?? 0) * 8 + random() * 5 + Math.sin(x / 110) * 2
    );
  });
  grayscale(roughness.context, (_x, y) => 209 + (rows[y] ?? 0) * 16);
  grayscale(color.context, (_x, y) => 231 + (rows[y] ?? 0) * 12);
  return {
    color: finishTexture(color.canvas, true),
    height: finishTexture(height.canvas),
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
  surface.context.fillStyle = "#8c8c8c";
  surface.context.fillRect(0, 0, textureSize, textureSize);
  surface.context.strokeStyle = "#d0d0d0";
  surface.context.lineWidth = 1.3;
  for (let offset = 0; offset <= textureSize; offset += 4) {
    surface.context.beginPath();
    surface.context.moveTo(offset, 0);
    surface.context.lineTo(offset, textureSize);
    surface.context.moveTo(0, offset);
    surface.context.lineTo(textureSize, offset);
    surface.context.stroke();
  }
  return finishTexture(surface.canvas);
}

export function createHd800sTextures() {
  const fabric = microfiberFinish();
  const metal = metalFinish();
  const powder = powderFinish();
  const cloth = acousticCloth();
  const textures = [
    ...Object.values(fabric),
    ...Object.values(metal),
    ...Object.values(powder),
    cloth,
  ];
  return {
    fabric,
    metal,
    powder,
    cloth,
    dispose() {
      for (const texture of textures) {
        texture.dispose();
      }
    },
  };
}
