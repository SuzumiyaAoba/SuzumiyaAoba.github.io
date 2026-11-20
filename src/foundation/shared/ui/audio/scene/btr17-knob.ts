import { BufferGeometry, Float32BufferAttribute } from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

const toothCount = 72;
const columns = toothCount * 2;
const diamondBands = 4;
const diamondStart = 1.7;
const helixStart = 3.25;
const helixLength = 2.2;

/** 刃先が通る山と谷に頂点を置き、綾目と斜め溝を切れ目なくつなぐ。 */
export function btr17KnobGeometry() {
  const positions: number[] = [];
  const indices: number[] = [];

  // phase は歯のピッチ単位。斜め溝では断面ごとに山と谷を一緒に回す。
  const ring = (
    x: number,
    valley: number,
    crest = valley,
    phase = 0,
    flip = false
  ) => {
    const start = positions.length / 3;
    for (let column = 0; column < columns; column += 1) {
      const angle = ((column / 2 + phase) * Math.PI * 2) / toothCount;
      const radius = column % 2 === 0 ? valley : crest;
      positions.push(x, radius * Math.cos(angle), radius * Math.sin(angle));
      if (start === 0) {
        continue;
      }
      const next = (column + 1) % columns;
      const a = start - columns + column;
      const b = start - columns + next;
      const c = start + column;
      const d = start + next;
      // 綾目の四面をそれぞれの谷で分け、格子の対角線が歯を横切るのを防ぐ。
      if ((column % 2 === 0) === flip) {
        indices.push(a, b, d, a, d, c);
      } else {
        indices.push(a, b, c, b, d, c);
      }
    }
  };

  ring(0, 4.2);
  ring(0.7, 4.2);
  ring(1.2, 4.8);
  ring(1.5, 4.8);
  ring(diamondStart, 5.47);
  const pitch = (helixStart - diamondStart) / diamondBands;
  for (let band = 0; band < diamondBands; band += 1) {
    ring(diamondStart + (band + 0.5) * pitch, 5.47, 5.6);
    ring(diamondStart + (band + 1) * pitch, 5.47, 5.47, 0, true);
  }

  const twist = helixLength * 1.15;
  for (let step = 0; step <= 12; step += 1) {
    const fraction = step / 12;
    ring(
      helixStart + 0.025 + (helixLength - 0.025) * fraction,
      5.48,
      5.6,
      twist * fraction
    );
  }
  ring(6.3, 4.8, 4.8, twist);
  ring(6.43, 4.65, 4.65, twist);
  ring(6.48, 4.4, 4.4, twist);
  ring(6.48, 4.25, 4.25, twist);
  const center = positions.length / 3;
  positions.push(0, 0, 0);
  for (let column = 0; column < columns; column += 1) {
    indices.push(center, (column + 1) % columns, column);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const machined = toCreasedNormals(geometry, Math.PI / 8);
  geometry.dispose();
  return machined;
}
