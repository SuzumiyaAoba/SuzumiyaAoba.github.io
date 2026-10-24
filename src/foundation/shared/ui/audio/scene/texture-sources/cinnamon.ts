import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
} from "three";

/** 交互に重なる黒い繊維束と、その縁の細い赤い糸を繰り返す編組。 */
export function createCinnamonBraidTextures() {
  const size = 512;
  const bundle = 128;
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
      const red = strand < 12;
      const crown = Math.sin((strand / bundle) * Math.PI);
      const thread = (strand / bundle) * 24;
      const grain =
        Math.sin(column * 17.13 + row * 91.7) *
        Math.sin(column * 5.23 - row * 13.81);
      const fiber = (0.5 + 0.5 * Math.cos(thread * Math.PI * 2)) ** 2;
      const shade = Math.round(15 + crown * 24 + fiber * 30 + grain * 5);
      const index = (row * size + column) * 4;
      pixels[index] = red ? 105 + Math.round(crown * 38 + fiber * 28) : shade;
      pixels[index + 1] = red ? 17 + Math.round(crown * 14 + fiber * 9) : shade;
      pixels[index + 2] = red
        ? 12 + Math.round(crown * 9 + fiber * 7)
        : shade + 2;
      pixels[index + 3] = 255;
      const height = 55 + crown * 120 + fiber * 40 + grain * 6;
      const matte = 190 + crown * 25 - fiber * 15 + (red ? -10 : 0);
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
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }
  return { color, height, roughness: matte };
}
