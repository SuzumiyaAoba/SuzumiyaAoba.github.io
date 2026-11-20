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

function textureSurface(size = textureSize) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
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
  const { width, height } = context.canvas;
  const pixels = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
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

function acousticCloth() {
  const surface = textureSurface();
  // 防塵布は黒い細線だけでなく、背後の支持枠を透かしつつ暗くする。
  // マスクの基底値を残し、耳側の六角形の編み目を描く。
  surface.context.fillStyle = "#b4b4b4";
  surface.context.fillRect(0, 0, textureSize, textureSize);
  surface.context.strokeStyle = "#f2f2f2";
  surface.context.lineWidth = 2.5;
  const columns = 16;
  const rows = 24;
  const halfWidth = textureSize / columns / 2;
  const rowStep = textureSize / rows;
  const radius = (rowStep * 2) / 3;
  for (let row = -1; row <= rows; row += 1) {
    for (let column = -1; column <= columns; column += 1) {
      const x = column * halfWidth * 2 + Math.abs(row % 2) * halfWidth;
      const y = row * rowStep;
      surface.context.beginPath();
      surface.context.moveTo(x, y - radius);
      surface.context.lineTo(x + halfWidth, y - radius / 2);
      surface.context.lineTo(x + halfWidth, y + radius / 2);
      surface.context.lineTo(x, y + radius);
      surface.context.lineTo(x - halfWidth, y + radius / 2);
      surface.context.lineTo(x - halfWidth, y - radius / 2);
      surface.context.closePath();
      surface.context.stroke();
    }
  }
  return finishTexture(surface.canvas);
}

/** 0.22 mm ピッチの織金網。色ではなく開口と線材の高さを別々に描く。 */
function steelMeshFinish() {
  const pitch = 32;
  const radius = pitch / 4;
  const aperture = textureSurface(2 * pitch);
  const height = textureSurface(2 * pitch);
  const distance = (coordinate: number) =>
    Math.abs(((coordinate + 0.5) % pitch) - pitch / 2);
  const coverage = (coordinate: number) =>
    Math.min(1, Math.max(0, radius + 0.5 - distance(coordinate)));
  const profile = (coordinate: number) =>
    Math.sqrt(Math.max(0, 1 - (distance(coordinate) / radius) ** 2));
  // 画素内で糸が覆う面積を保存し、縮小時にも織金網の透け方を保つ。
  grayscale(
    aperture.context,
    (x, y) => 255 * (1 - (1 - coverage(x)) * (1 - coverage(y)))
  );
  grayscale(height.context, (x, y) => {
    const crossing =
      Math.sin(((x + 0.5) * Math.PI) / pitch) *
      Math.sin(((y + 0.5) * Math.PI) / pitch);
    const warp = profile(x) * (0.76 + 0.24 * crossing);
    const weft = profile(y) * (0.76 - 0.24 * crossing);
    return Math.max(warp, weft) * 255;
  });
  return {
    mask: finishTexture(aperture.canvas),
    height: finishTexture(height.canvas),
  };
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
  const cloth = acousticCloth();
  const mesh = steelMeshFinish();
  const grille = grilleMask();
  const textures = [
    ...Object.values(fabric),
    ...Object.values(metal),
    cloth,
    ...Object.values(mesh),
    grille,
  ];
  return {
    fabric,
    metal,
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
