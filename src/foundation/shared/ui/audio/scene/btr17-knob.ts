import { BufferGeometry, Float32BufferAttribute } from "three";

const COLUMNS = 576;
const KNURL_COUNT = 72;

function engravedRadius(length: number, angle: number) {
  const circumferential = (angle * KNURL_COUNT) / (Math.PI * 2);
  if (length <= 3.25) {
    const axial = (length - 1.7) / 0.38;
    const u = Math.abs(2 * (circumferential - Math.floor(circumferential)) - 1);
    const v = Math.abs(2 * (axial - Math.floor(axial)) - 1);
    return 5.47 + 0.13 * Math.max(0, 1 - u - v);
  }
  const phase = circumferential - (length - 3.25) * 1.15;
  const groove = Math.abs(2 * (phase - Math.floor(phase)) - 1);
  return 5.6 - groove * 0.12;
}

/** メーカー分解図の二種類の切削：根元側の綾目、外側の斜め溝。 */
export function btr17KnobGeometry() {
  const rows: [number, number][] = [
    [0, 0],
    [0, 4.2],
    [0.7, 4.2],
    [1.2, 4.8],
    [1.5, 4.8],
  ];
  for (let row = 0; row <= 90; row += 1) {
    rows.push([1.7 + (row / 90) * 3.75, 5.6]);
  }
  rows.push([6.3, 4.8], [6.43, 4.65], [6.48, 4.4], [6.48, 4.25]);
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [length, radius] of rows) {
    for (let column = 0; column <= COLUMNS; column += 1) {
      const angle = (column / COLUMNS) * Math.PI * 2;
      const surface =
        length >= 1.7 && length <= 5.45
          ? engravedRadius(length, angle)
          : radius;
      positions.push(
        length,
        surface * Math.cos(angle),
        surface * Math.sin(angle)
      );
    }
  }
  for (let row = 0; row < rows.length - 1; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const a = row * (COLUMNS + 1) + column;
      const b = a + COLUMNS + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
