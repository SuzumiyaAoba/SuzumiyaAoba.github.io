import { ExtrudeGeometry } from "three";
import { Font } from "three/addons/loaders/FontLoader.js";
import fontData from "./sigma-pro-fonts.json";

const fonts = {
  sans: new Font(fontData.sans),
  serif: new Font(fontData.serif),
  wordmark: new Font(fontData.wordmark),
};

export type SigmaFont = keyof typeof fonts;

/** Solid outlines, including counters. Every letter has real edges and thickness. */
export function sigmaLetteringGeometry(
  text: string,
  height: number,
  font: SigmaFont = "sans",
  maxWidth = Number.POSITIVE_INFINITY
) {
  const geometry = new ExtrudeGeometry(fonts[font].generateShapes(text, 1), {
    depth: 0.006,
    bevelEnabled: false,
    curveSegments: 6,
  });
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) {
    return geometry;
  }
  const scale = height / (bounds.max.y - bounds.min.y);
  const width = (bounds.max.x - bounds.min.x) * scale;
  geometry.translate(
    -(bounds.min.x + bounds.max.x) / 2,
    -(bounds.min.y + bounds.max.y) / 2,
    0
  );
  geometry.scale(scale * Math.min(1, maxWidth / width), scale, 1);
  return geometry;
}
