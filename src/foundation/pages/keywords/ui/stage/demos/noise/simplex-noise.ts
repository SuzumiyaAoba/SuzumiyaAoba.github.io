import { Vector2, Vector3 } from "three";
import { glslGridLine, glslHash, glslPerlin, glslSimplex2 } from "../../glsl";
import { marker, palette, segments } from "../../kit";
import { heightSurface } from "../../surface";
import type { DemoModule } from "../../types";

const SIZE = 9;
const CELL = 1.35;
const F2 = (Math.sqrt(3) - 1) / 2;
const G2 = (3 - Math.sqrt(3)) / 6;

/** ノイズ座標 (x, y) を含む単体（三角形）または正方形の頂点を返す。 */
function cellCorners(x: number, y: number, simplex: boolean) {
  if (!simplex) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    return [
      [i, j],
      [i + 1, j],
      [i, j + 1],
      [i + 1, j + 1],
    ] as const;
  }
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const [i1, j1] = x0 > y0 ? [1, 0] : [0, 1];
  const unskew = (a: number, b: number) =>
    [a - (a + b) * G2, b - (a + b) * G2] as const;
  return [unskew(i, j), unskew(i + i1, j + j1), unskew(i + 1, j + 1)] as const;
}

export const demo: DemoModule = {
  alt: "ノイズの起伏を持つ面の上に、シンプレックスノイズの三角形の格子とパーリンノイズの正方形の格子を切り替えて表示する。ポインターを当てた点の値を決める格子点が強調される。",
  camera: { position: [0.4, 9.5, 8.6], target: [0, -0.4, 0.4] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "格子",
      value: "simplex",
      options: [
        { value: "simplex", label: "シンプレックス（三角形）" },
        { value: "perlin", label: "パーリン（正方形）" },
      ],
    },
    {
      type: "range",
      key: "amplitude",
      label: "高さの倍率",
      min: 0,
      max: 1.6,
      step: 0.05,
      value: 0.35,
      hint: "0 にすると模様だけを平面で比べられます。",
    },
    { type: "toggle", key: "lattice", label: "格子線を表示", value: true },
    { type: "toggle", key: "drift", label: "ゆっくり流す", value: true },
  ],
  legend: [
    { color: palette.amber, label: "格子線" },
    { color: palette.coral, label: "値の計算に使う格子点" },
  ],
  hint: "面の上にポインターを置くと、その点の値に寄与する格子点が表示されます。",
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uMode: { value: 1 },
      uAmp: { value: 0.35 },
      uLattice: { value: 1 },
      uOffset: { value: new Vector2() },
      uHover: { value: new Vector3(0, 0, 0) },
    };
    const surface = heightSurface({
      width: SIZE,
      segments: 240,
      uniforms,
      functions: /* glsl */ `
        ${glslHash}
        ${glslPerlin}
        ${glslSimplex2}
        ${glslGridLine}
        const float F2 = 0.366025403784439;
        float noiseAt(vec2 q) {
          return uMode > 0.5 ? snoise2(q) * 0.75 : perlin2(q) * 1.05;
        }
        vec2 noiseCoord(vec2 p) { return p / ${CELL.toFixed(3)} + uOffset; }
        float surfaceHeight(vec2 p) {
          return noiseAt(noiseCoord(p)) * uAmp;
        }
        vec3 cellId(vec2 q) {
          if (uMode > 0.5) {
            vec2 s = q + (q.x + q.y) * F2;
            vec2 i = floor(s);
            vec2 f = s - i;
            return vec3(i, f.x > f.y ? 1.0 : 0.0);
          }
          return vec3(floor(q), 0.0);
        }
        vec3 surfaceColor(vec2 p, float h, vec3 n) {
          vec2 q = noiseCoord(p);
          float v = clamp(noiseAt(q) * 0.75 + 0.5, 0.0, 1.0);
          vec3 low = vec3(0.07, 0.10, 0.28);
          vec3 mid = vec3(0.08, 0.45, 0.52);
          vec3 high = vec3(0.80, 0.88, 0.78);
          vec3 color = v < 0.5 ? mix(low, mid, v * 2.0) : mix(mid, high, v * 2.0 - 1.0);
          float line;
          if (uMode > 0.5) {
            vec2 s = q + (q.x + q.y) * F2;
            line = max(max(gridLine(s.x, 0.4), gridLine(s.y, 0.4)), gridLine(s.x - s.y, 0.4));
          } else {
            line = max(gridLine(q.x, 0.4), gridLine(q.y, 0.4));
          }
          color = mix(color, vec3(0.97, 0.71, 0.30), line * 0.85 * uLattice);
          if (uHover.z > 0.5 && cellId(q) == cellId(uHover.xy)) {
            color = mix(color, vec3(0.96, 0.45, 0.43), 0.35);
          }
          return color;
        }
      `,
    });
    scene.add(surface);

    const corners = Array.from({ length: 4 }, () => {
      const item = marker(palette.coral, 0.09);
      item.material.depthTest = false;
      item.material.transparent = true;
      item.renderOrder = 10;
      item.castShadow = false;
      scene.add(item);
      return item;
    });
    const probe = marker(palette.ink, 0.07);
    probe.material.depthTest = false;
    probe.material.transparent = true;
    probe.renderOrder = 10;
    scene.add(probe);
    const spokes = segments([], palette.coral, { width: 2, opacity: 0.9 });
    spokes.material.depthTest = false;
    spokes.renderOrder = 9;
    scene.add(spokes);
    const probeLabel = context.label("", { color: palette.ink });
    scene.add(probeLabel);

    const hover = new Vector3();
    const offset = new Vector2();

    return {
      update({ dt }) {
        const simplex = params["mode"] === "simplex";
        if (params["drift"] === true) {
          offset.x += dt * 0.12;
          offset.y += dt * 0.05;
        }
        uniforms.uMode.value = simplex ? 1 : 0;
        uniforms.uAmp.value = Number(params["amplitude"]);
        uniforms.uLattice.value = params["lattice"] === true ? 1 : 0;
        uniforms.uOffset.value.copy(offset);

        const point = context.pointerOnPlane({}, hover);
        const inside =
          point !== null &&
          Math.abs(point.x) < SIZE / 2 &&
          Math.abs(point.z) < SIZE / 2;
        uniforms.uHover.value.set(0, 0, 0);
        const spokePoints: Vector3[] = [];
        let used = 0;
        if (inside) {
          const qx = hover.x / CELL + offset.x;
          const qy = hover.z / CELL + offset.y;
          uniforms.uHover.value.set(qx, qy, 1);
          probe.position.set(hover.x, 0.05, hover.z);
          for (const [cx, cy] of cellCorners(qx, qy, simplex)) {
            const item = corners[used];
            if (!item) {
              continue;
            }
            item.position.set(
              (cx - offset.x) * CELL,
              0.05,
              (cy - offset.y) * CELL
            );
            spokePoints.push(probe.position.clone(), item.position.clone());
            used++;
          }
          probeLabel.position.set(hover.x, 0.45, hover.z);
          probeLabel.setText(`格子点 ${used} 個から計算`);
        }
        probe.visible = inside;
        probeLabel.visible = inside;
        spokes.visible = inside;
        if (inside) {
          spokes.setPoints(spokePoints);
        }
        for (const [index, item] of corners.entries()) {
          item.visible = index < used;
        }

        context.readout("参照する格子点（2D）", simplex ? "3 個" : "4 個");
        context.readout("同（3D）", simplex ? "4 個" : "8 個");
        context.readout("同（4D）", simplex ? "5 個" : "16 個");
        context.caption(
          simplex
            ? "空間を三角形（3D では四面体）に分け、囲む頂点だけを足し合わせる。次元が増えても参照点は n+1 個。"
            : "正方形の格子では 4 隅すべてを補間する。3D なら 8 隅、4D なら 16 隅と倍々に増える。"
        );
      },
    };
  },
};
