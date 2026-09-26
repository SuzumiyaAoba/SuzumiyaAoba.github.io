import {
  BoxGeometry,
  CylinderGeometry,
  DataTexture,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  Vector2,
} from "three";
import { palette, standard, TAU } from "../../kit";
import type { DemoModule } from "../../types";

type Point = readonly [number, number];
/** 1 つの閉じた輪郭。外周は反時計回り、穴は時計回り（左側が塗りつぶし側）。 */
type Contour = readonly Point[];

/** 文字「A」（外周と三角形の穴）。セル内の 0〜1 座標。 */
const glyphA: readonly Contour[] = [
  [
    [0.08, 0.06],
    [0.3, 0.06],
    [0.37, 0.27],
    [0.63, 0.27],
    [0.7, 0.06],
    [0.92, 0.06],
    [0.61, 0.94],
    [0.39, 0.94],
  ],
  [
    [0.43, 0.43],
    [0.5, 0.68],
    [0.57, 0.43],
  ],
];

/** 5 つの頂点を持つ星。 */
const glyphStar: readonly Contour[] = [
  Array.from({ length: 10 }, (_, index): Point => {
    const angle = Math.PI / 2 + (index / 10) * TAU;
    const radius = index % 2 === 0 ? 0.46 : 0.19;
    return [0.5 + Math.cos(angle) * radius, 0.48 + Math.sin(angle) * radius];
  }),
];

const GLYPHS = [glyphA, glyphStar] as const;
const PX_RANGE = 6;

/** チャンネルの組（R, G, B）。隣り合う辺は必ず異なる組にする。 */
const CHANNEL_SETS = [
  [true, true, false],
  [false, true, true],
  [true, false, true],
] as const;

type Edge = {
  a: Point;
  b: Point;
  channels: readonly [boolean, boolean, boolean];
};

function colorEdges(contours: readonly Contour[]) {
  const edges: Edge[] = [];
  for (const contour of contours) {
    const count = contour.length;
    const colors = Array.from({ length: count }, (_, index) => index % 3);
    // 最後の辺と最初の辺が同じ組になったら、両隣と違う組に変える
    if (count > 1 && colors[count - 1] === colors[0]) {
      colors[count - 1] =
        [0, 1, 2].find(
          (color) => color !== colors[0] && color !== colors[count - 2]
        ) ?? 0;
    }
    for (let index = 0; index < count; index++) {
      const a = contour[index];
      const b = contour[(index + 1) % count];
      const set = CHANNEL_SETS[colors[index] ?? 0];
      if (a && b && set) {
        edges.push({ a, b, channels: set });
      }
    }
  }
  return edges;
}

/** 線分への真の距離と、辺の延長線への符号付き擬距離（左側 = 内側を正）。 */
function measure(edge: Edge, x: number, y: number) {
  const [ax, ay] = edge.a;
  const [bx, by] = edge.b;
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);
  const t = Math.max(
    0,
    Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (length * length))
  );
  const distance = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
  const pseudo = (dx * (y - ay) - dy * (x - ax)) / length;
  return { distance, pseudo };
}

function inside(contours: readonly Contour[], x: number, y: number) {
  let crossings = 0;
  for (const contour of contours) {
    for (let index = 0; index < contour.length; index++) {
      const a = contour[index];
      const b = contour[(index + 1) % contour.length];
      if (!a || !b) {
        continue;
      }
      if (a[1] > y !== b[1] > y) {
        const cross = a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
        if (x < cross) {
          crossings++;
        }
      }
    }
  }
  return crossings % 2 === 1;
}

/** 低解像度の 3 種類のテクスチャ（ビットマップ、SDF、MSDF）を作る。 */
function buildTextures(resolution: number) {
  const width = resolution * GLYPHS.length;
  const height = resolution;
  const atlas = new Uint8Array(width * height * 4);
  const bitmap = new Uint8Array(width * height * 4);
  const range = PX_RANGE / resolution;
  const encode = (value: number) =>
    Math.round(Math.max(0, Math.min(1, value / range + 0.5)) * 255);
  for (const [glyphIndex, contours] of GLYPHS.entries()) {
    const edges = colorEdges(contours);
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < resolution; px++) {
        const x = (px + 0.5) / resolution;
        const y = (py + 0.5) / resolution;
        const index = (py * width + glyphIndex * resolution + px) * 4;
        // 1 チャンネル SDF：全ての辺への最短距離 + 内外判定の符号
        const solid = inside(contours, x, y);
        let nearest = Infinity;
        for (const edge of edges) {
          nearest = Math.min(nearest, measure(edge, x, y).distance);
        }
        atlas[index + 3] = encode(solid ? nearest : -nearest);
        // MSDF：チャンネルごとに、そのチャンネルを含む辺だけから最寄りを選び、擬距離を書く
        for (let channel = 0; channel < 3; channel++) {
          let best = Infinity;
          let pseudo = 0;
          for (const edge of edges) {
            if (!edge.channels[channel]) {
              continue;
            }
            const { distance, pseudo: candidate } = measure(edge, x, y);
            if (distance < best - 1e-9) {
              best = distance;
              pseudo = candidate;
            }
          }
          atlas[index + channel] = encode(pseudo);
        }
        // 誤り補正：中央値の内外が真の内外と食い違うテクセルと、輪郭から離れていて
        // 角の再現に関係しないテクセルは、3 チャンネルとも真の距離にそろえる（補間時の食い違いを防ぐ）
        const r = atlas[index] ?? 0;
        const g = atlas[index + 1] ?? 0;
        const b = atlas[index + 2] ?? 0;
        const median = Math.max(Math.min(r, g), Math.min(Math.max(r, g), b));
        const far = nearest > 1.5 / resolution;
        if (median >= 128 !== solid || far) {
          const value = atlas[index + 3] ?? 0;
          atlas[index] = value;
          atlas[index + 1] = value;
          atlas[index + 2] = value;
        }
        // ビットマップ：4×4 のスーパーサンプリングで被覆率を求める
        let covered = 0;
        for (let sy = 0; sy < 4; sy++) {
          for (let sx = 0; sx < 4; sx++) {
            if (
              inside(
                contours,
                (px + (sx + 0.5) / 4) / resolution,
                (py + (sy + 0.5) / 4) / resolution
              )
            ) {
              covered++;
            }
          }
        }
        const coverage = Math.round((covered / 16) * 255);
        bitmap[index] = coverage;
        bitmap[index + 1] = coverage;
        bitmap[index + 2] = coverage;
        bitmap[index + 3] = 255;
      }
    }
  }
  const make = (data: Uint8Array) => {
    const texture = new DataTexture(data, width, height, RGBAFormat);
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  };
  return {
    atlas: make(atlas),
    bitmap: make(bitmap),
    size: new Vector2(width, height),
  };
}

const METHODS = [
  { key: "bitmap", title: "ビットマップ" },
  { key: "sdf", title: "SDF（1 チャンネル）" },
  { key: "msdf", title: "MSDF（3 チャンネル）" },
] as const;

export const demo: DemoModule = {
  alt: "わずか十数ピクセル四方のテクスチャから、文字「A」と星のアイコンを大きく描き比べる MSDF のデモ。ビットマップはぼやけ、1 チャンネルの SDF は輪郭はくっきりするが角が丸くなる。3 チャンネルに辺ごとの距離を分けて持つ MSDF は、中央値を取ることで鋭い角まで再現する。距離の情報があるので、縁取りや光彩も 1 回の読み込みで描ける。",
  camera: { position: [0, 1.7, 6.2], target: [0, 1.5, 0] },
  controls: [
    {
      type: "range",
      key: "resolution",
      label: "テクスチャの解像度（1 文字あたり）",
      min: 8,
      max: 40,
      step: 1,
      value: 14,
      format: (value) => `${value}×${value} px`,
    },
    {
      type: "toggle",
      key: "effects",
      label: "縁取りと光彩",
      value: false,
      hint: "距離が分かるので、しきい値をずらすだけで縁取りや光彩を描けます（ビットマップは対象外）。",
    },
    {
      type: "toggle",
      key: "raw",
      label: "テクスチャの中身を表示",
      value: false,
    },
  ],
  legend: [
    { color: palette.amber, label: "縁取り" },
    { color: palette.cyan, label: "光彩" },
  ],
  hint: "Ctrl（⌘）+ スクロールで近づくと、角の違いがよく分かります。",
  setup(context) {
    const { scene, params } = context;
    let textures = buildTextures(14);
    let builtResolution = 14;
    const uniforms = {
      uAtlas: { value: textures.atlas },
      uBitmap: { value: textures.bitmap },
      uTexSize: { value: textures.size },
      uPxRange: { value: PX_RANGE },
      uRaw: { value: 0 },
      uEffects: { value: 0 },
    };
    const frame = standard("#222b38", { metalness: 0.6, roughness: 0.35 });
    for (const [index, method] of METHODS.entries()) {
      const x = (index - 1) * 2.75;
      const plate = new Mesh(
        new PlaneGeometry(2.4, 1.2),
        new ShaderMaterial({
          uniforms: { ...uniforms, uMethod: { value: index } },
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            uniform sampler2D uAtlas;
            uniform sampler2D uBitmap;
            uniform vec2 uTexSize;
            uniform float uPxRange;
            uniform float uMethod;
            uniform float uRaw;
            uniform float uEffects;
            varying vec2 vUv;
            float median(vec3 c) { return max(min(c.r, c.g), min(max(c.r, c.g), c.b)); }
            void main() {
              vec3 background = vec3(0.06, 0.08, 0.12);
              if (uRaw > 0.5) {
                // 最近傍で 1 テクセルずつ表示する
                ivec2 texel = ivec2(floor(vUv * uTexSize));
                vec4 a = texelFetch(uAtlas, texel, 0);
                vec3 raw = uMethod < 0.5 ? texelFetch(uBitmap, texel, 0).rgb : uMethod < 1.5 ? vec3(a.a) : a.rgb;
                gl_FragColor = vec4(pow(raw, vec3(2.2)), 1.0);
                #include <colorspace_fragment>
                return;
              }
              vec4 t = texture2D(uAtlas, vUv);
              vec3 ink = vec3(0.86, 0.89, 0.93);
              float alpha;
              if (uMethod < 0.5) {
                alpha = texture2D(uBitmap, vUv).r;
              } else {
                float sd = uMethod < 1.5 ? t.a : median(t.rgb);
                // 画面上で距離 1 テクセルが何ピクセルに当たるかを求め、1 ピクセル幅で滑らかにする
                vec2 unitRange = vec2(uPxRange) / uTexSize;
                vec2 screenTexSize = vec2(1.0) / fwidth(vUv);
                float screenPxRange = max(0.5 * dot(unitRange, screenTexSize), 1.0);
                alpha = clamp(screenPxRange * (sd - 0.5) + 0.5, 0.0, 1.0);
              }
              vec3 color = background;
              if (uEffects > 0.5 && uMethod > 0.5) {
                // 効果には真の距離（A チャンネル）を使う
                float d = t.a - 0.5;
                float glow = exp(-max(-d, 0.0) * 7.0) * step(d, 0.0) * 0.8;
                color += vec3(0.25, 0.84, 0.78) * glow;
                float outline = smoothstep(-0.13, -0.1, d) * (1.0 - alpha);
                color = mix(color, vec3(0.97, 0.71, 0.3), outline);
              }
              color = mix(color, ink, alpha);
              gl_FragColor = vec4(pow(color, vec3(2.2)), 1.0);
              #include <colorspace_fragment>
            }
          `,
        })
      );
      plate.position.set(x, 1.55, 0.061);
      const back = new Mesh(new BoxGeometry(2.56, 1.36, 0.1), frame);
      back.position.set(x, 1.55, 0);
      back.castShadow = true;
      const post = new Mesh(new CylinderGeometry(0.04, 0.05, 0.9, 12), frame);
      post.position.set(x, 0.45, -0.02);
      post.castShadow = true;
      const label = context.label(method.title, { size: "md" });
      label.position.set(x, 2.45, 0);
      scene.add(back, plate, post, label);
    }

    return {
      update() {
        const resolution = Number(params["resolution"]);
        if (resolution !== builtResolution) {
          textures.atlas.dispose();
          textures.bitmap.dispose();
          textures = buildTextures(resolution);
          builtResolution = resolution;
          uniforms.uAtlas.value = textures.atlas;
          uniforms.uBitmap.value = textures.bitmap;
          uniforms.uTexSize.value = textures.size;
        }
        uniforms.uRaw.value = params["raw"] === true ? 1 : 0;
        uniforms.uEffects.value = params["effects"] === true ? 1 : 0;
        context.readout(
          "テクスチャ",
          `${textures.size.x}×${textures.size.y} px`
        );
        context.readout("距離の範囲", `±${PX_RANGE / 2} px`);
        context.caption(
          params["raw"] === true
            ? "MSDF の中身。赤・緑・青のそれぞれが、一部の辺だけへの距離を持つ。角では 2 つの辺が別のチャンネルに入るので、3 つの中央値を取ると角が復元される。"
            : "同じ小さなテクスチャを拡大しても、距離を補間する SDF は輪郭がくっきりする。ただし 1 チャンネルでは角が丸まり、辺ごとに距離を分けた MSDF だけが鋭い角を保つ。"
        );
      },
      dispose() {
        textures.atlas.dispose();
        textures.bitmap.dispose();
      },
    };
  },
};
