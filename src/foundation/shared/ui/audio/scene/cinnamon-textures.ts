import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
} from "three";

/** 交互に重なる黒い繊維束と、その縁の細い赤い糸を繰り返す編組。 */
export function cinnamonBraidTextures(length: number, radius: number) {
  const size = 256;
  const bundle = 64;
  const pixels = new Uint8Array(size * size * 4);
  const relief = new Uint8Array(pixels.length);
  const roughness = new Uint8Array(pixels.length);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const rising = column + row;
      const falling = column - row + size;
      const over =
        (Math.floor(rising / bundle) + Math.floor(falling / bundle)) % 2 === 0;
      const strand = (over ? rising : falling) % bundle;
      const red = strand < 7;
      const crown = Math.sin((strand / bundle) * Math.PI);
      const fiber = Math.sin(strand * Math.PI * 0.5) * 5;
      const shade = Math.round(24 + crown * 26 + fiber);
      const index = (row * size + column) * 4;
      pixels[index] = red ? 145 + Math.round(crown * 45) : shade;
      pixels[index + 1] = red ? 25 + Math.round(crown * 18) : shade;
      pixels[index + 2] = red ? 18 + Math.round(crown * 12) : shade + 2;
      pixels[index + 3] = 255;
      const height = 80 + crown * 115 + fiber * 2;
      const matte = 200 + crown * 25 + (red ? -10 : 0);
      for (const channel of [0, 1, 2]) {
        relief[index + channel] = height;
        roughness[index + channel] = matte;
      }
      relief[index + 3] = 255;
      roughness[index + 3] = 255;
    }
  }
  const color = new DataTexture(pixels, size, size, RGBAFormat);
  color.colorSpace = SRGBColorSpace;
  const height = new DataTexture(relief, size, size, RGBAFormat);
  const matte = new DataTexture(roughness, size, size, RGBAFormat);
  for (const texture of [color, height, matte]) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(length / 16, (2 * Math.PI * radius) / 16);
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }
  return { color, height, roughness: matte };
}

export function drawCinnamonMark(context: CanvasRenderingContext2D) {
  context.fillStyle = "#eee9df";
  context.strokeStyle = "#eee9df";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 1.75px Arial";
  context.fillText("CINNAMON", 0, -4.5, 11.5);
  context.lineWidth = 0.35;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(0, 4);
  context.lineTo(0, -2);
  context.moveTo(0, 2);
  context.lineTo(-1.7, 0.3);
  context.lineTo(-1.7, -1);
  context.moveTo(0, 0.5);
  context.lineTo(1.7, -1);
  context.lineTo(1.7, -1.8);
  context.stroke();
  context.beginPath();
  context.moveTo(0, -2.8);
  context.lineTo(-0.7, -1.7);
  context.lineTo(0.7, -1.7);
  context.closePath();
  context.fill();
  for (const [x, y, radius] of [
    [0, 4, 0.8],
    [-1.7, -1.2, 0.45],
  ] as const) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.fillRect(1.25, -2.35, 0.9, 0.9);
}
