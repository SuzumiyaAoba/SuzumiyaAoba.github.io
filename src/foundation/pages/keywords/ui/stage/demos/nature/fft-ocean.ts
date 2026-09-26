import {
  Color,
  DataTexture,
  FloatType,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  RGBAFormat,
} from "three";
import { palette, rng, TAU } from "../../kit";
import type { DemoModule } from "../../types";

const N = 64;
const PATCH = 32;
const GRAVITY = 9.81;
/** 見やすい波の高さに合わせる倍率。 */
const HEIGHT_SCALE = 0.3;

/** 長さ N の複素数列を、その場で逆フーリエ変換する（基数 2、正規化なし）。 */
function ifft(
  re: Float64Array,
  im: Float64Array,
  offset: number,
  stride: number
) {
  // ビット反転の並べ替え
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      const a = offset + i * stride;
      const b = offset + j * stride;
      [re[a], re[b]] = [re[b] ?? 0, re[a] ?? 0];
      [im[a], im[b]] = [im[b] ?? 0, im[a] ?? 0];
    }
  }
  for (let size = 2; size <= N; size <<= 1) {
    const angle = TAU / size;
    for (let start = 0; start < N; start += size) {
      for (let k = 0; k < size / 2; k++) {
        const wr = Math.cos(angle * k);
        const wi = Math.sin(angle * k);
        const a = offset + (start + k) * stride;
        const b = offset + (start + k + size / 2) * stride;
        const br = re[b] ?? 0;
        const bi = im[b] ?? 0;
        const tr = br * wr - bi * wi;
        const ti = br * wi + bi * wr;
        const ar = re[a] ?? 0;
        const ai = im[a] ?? 0;
        re[b] = ar - tr;
        im[b] = ai - ti;
        re[a] = ar + tr;
        im[a] = ai + ti;
      }
    }
  }
}

function ifft2(re: Float64Array, im: Float64Array) {
  for (let row = 0; row < N; row++) {
    ifft(re, im, row * N, 1);
  }
  for (let column = 0; column < N; column++) {
    ifft(re, im, column, N);
  }
}

/** 標準正規分布の乱数（ボックス＝ミュラー法）。 */
function gaussian(random: () => number) {
  const u = Math.max(random(), 1e-9);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

export const demo: DemoModule = {
  alt: "風の強さと向きから決まる波の周波数分布（スペクトル）をもとに、何千もの波を一度に重ね合わせて広い海面を作る FFT 海洋のデモ。周波数空間で各波の高さと位相を時間とともに回し、逆フーリエ変換で一気に高さの画像へ変換する。できた 32 m 四方の海面は端がつながっているので、タイル状に敷き詰めて無限の海にできる。",
  camera: { position: [20, 17, 24], target: [0, -2, 0] },
  studio: { floor: false, background: "#0b1826" },
  controls: [
    {
      type: "range",
      key: "wind",
      label: "風速",
      min: 3,
      max: 22,
      step: 0.5,
      value: 11,
      format: (value) => `${value} m/s`,
    },
    {
      type: "range",
      key: "direction",
      label: "風向き",
      min: 0,
      max: 360,
      step: 5,
      value: 30,
      format: (value) => `${value}°`,
    },
    {
      type: "range",
      key: "choppy",
      label: "波頭の尖り（横方向の変位）",
      min: 0,
      max: 2,
      step: 0.05,
      value: 1.2,
    },
    {
      type: "toggle",
      key: "tiles",
      label: "タイルの継ぎ目を表示",
      value: false,
    },
  ],
  legend: [{ color: palette.amber, label: "32 m 四方の 1 タイル（繰り返し）" }],
  setup(context) {
    const { scene, params } = context;
    const random = rng(12);
    const h0 = { re: new Float64Array(N * N), im: new Float64Array(N * N) };
    const noise = Array.from(
      { length: N * N },
      () => [gaussian(random), gaussian(random)] as const
    );
    const omega = new Float64Array(N * N);
    const kx = new Float64Array(N * N);
    const kz = new Float64Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const index = y * N + x;
        kx[index] = (TAU * (x - N / 2)) / PATCH;
        kz[index] = (TAU * (y - N / 2)) / PATCH;
        omega[index] = Math.sqrt(
          GRAVITY * Math.hypot(kx[index] ?? 0, kz[index] ?? 0)
        );
      }
    }
    let spectrumKey = "";
    // フィリップス・スペクトル：風の向きに沿った、風速で決まる長さの波ほど強い
    const buildSpectrum = (wind: number, direction: number) => {
      const wx = Math.cos(direction);
      const wz = Math.sin(direction);
      const largest = (wind * wind) / GRAVITY;
      for (let index = 0; index < N * N; index++) {
        const x = kx[index] ?? 0;
        const z = kz[index] ?? 0;
        const k = Math.hypot(x, z);
        let phillips = 0;
        if (k > 1e-6) {
          const alignment = (x * wx + z * wz) / k;
          phillips =
            (0.0012 *
              Math.exp(-1 / (k * largest) ** 2) *
              alignment ** 2 *
              Math.exp(-(k * k) * 0.01)) /
            k ** 4;
          if (alignment < 0) {
            phillips *= 0.07;
          }
        }
        const [g1, g2] = noise[index] ?? [0, 0];
        const amplitude = Math.sqrt(phillips / 2);
        h0.re[index] = g1 * amplitude;
        h0.im[index] = g2 * amplitude;
      }
    };

    const data = new Float32Array(N * N * 4);
    const texture = context.track(
      new DataTexture(data, N, N, RGBAFormat, FloatType)
    );
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    const height = { re: new Float64Array(N * N), im: new Float64Array(N * N) };
    const dispX = { re: new Float64Array(N * N), im: new Float64Array(N * N) };
    const dispZ = { re: new Float64Array(N * N), im: new Float64Array(N * N) };
    const evolve = (time: number, choppy: number) => {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const index = y * N + x;
          const mirror = ((N - y) % N) * N + ((N - x) % N);
          const w = (omega[index] ?? 0) * time;
          const c = Math.cos(w);
          const s = Math.sin(w);
          // h(k, t) = h0(k) e^{iωt} + conj(h0(−k)) e^{−iωt}
          const ar = h0.re[index] ?? 0;
          const ai = h0.im[index] ?? 0;
          const br = h0.re[mirror] ?? 0;
          const bi = -(h0.im[mirror] ?? 0);
          const hr = ar * c - ai * s + (br * c + bi * s);
          const hi = ar * s + ai * c + (bi * c - br * s);
          height.re[index] = hr;
          height.im[index] = hi;
          // 横方向の変位：D(k) = −i k/|k| h(k)
          const k = Math.hypot(kx[index] ?? 0, kz[index] ?? 0) || 1;
          const ux = (kx[index] ?? 0) / k;
          const uz = (kz[index] ?? 0) / k;
          dispX.re[index] = ux * hi * choppy;
          dispX.im[index] = -ux * hr * choppy;
          dispZ.re[index] = uz * hi * choppy;
          dispZ.im[index] = -uz * hr * choppy;
        }
      }
      ifft2(height.re, height.im);
      ifft2(dispX.re, dispX.im);
      ifft2(dispZ.re, dispZ.im);
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const index = y * N + x;
          const sign = ((x + y) % 2 === 0 ? 1 : -1) * HEIGHT_SCALE;
          data[index * 4] = (dispX.re[index] ?? 0) * sign;
          data[index * 4 + 1] = (height.re[index] ?? 0) * sign;
          data[index * 4 + 2] = (dispZ.re[index] ?? 0) * sign;
          data[index * 4 + 3] = 1;
        }
      }
      texture.needsUpdate = true;
    };

    // 3×3 タイル分の海面。頂点シェーダーで変位の画像を読んで動かす
    const tilesUniform = { value: 0 };
    const geometry = new PlaneGeometry(PATCH * 3, PATCH * 3, 384, 384);
    geometry.rotateX(-Math.PI / 2);
    const material = new MeshStandardMaterial({
      color: new Color("#0c4a66"),
      roughness: 0.14,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, {
        uDisplacement: { value: texture },
        uTiles: tilesUniform,
      });
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform sampler2D uDisplacement;
          varying vec2 vPatch;
          varying float vCrest;
          vec3 displaced(vec2 p) {
            vec3 d = texture2D(uDisplacement, p / ${PATCH.toFixed(1)}).xyz;
            return vec3(p.x + d.x, d.y, p.y + d.z);
          }`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `float e = ${(PATCH / N).toFixed(3)};
          vec3 center = displaced(position.xz);
          vec3 dx = displaced(position.xz + vec2(e, 0.0)) - displaced(position.xz - vec2(e, 0.0));
          vec3 dz = displaced(position.xz + vec2(0.0, e)) - displaced(position.xz - vec2(0.0, e));
          vec3 objectNormal = normalize(cross(dz, dx));
          vPatch = position.xz / ${PATCH.toFixed(1)};
          vCrest = center.y;`
        )
        .replace("#include <begin_vertex>", "vec3 transformed = center;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTiles;\nvarying vec2 vPatch;\nvarying float vCrest;"
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.4, 1.8, 1.6), smoothstep(-0.2, 1.2, vCrest) * 0.7);
          vec2 cell = abs(fract(vPatch + 0.5) - 0.5);
          float seam = 1.0 - smoothstep(0.0, 0.012, min(cell.x, cell.y));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.71, 0.3), seam * uTiles);`
        );
    };
    material.customProgramCacheKey = () => "fft-ocean";
    const ocean = new Mesh(geometry, material);
    ocean.frustumCulled = false;
    scene.add(ocean);

    // HUD：スペクトル（周波数空間の波の強さ）
    const figure = document.createElement("figure");
    figure.className = "keyword-stage-graph";
    const caption = document.createElement("figcaption");
    caption.textContent = "波のスペクトル（中心 = 長い波、外側 = 短い波）";
    const canvas = document.createElement("canvas");
    canvas.width = N;
    canvas.height = N;
    canvas.style.width = "9rem";
    canvas.style.display = "block";
    canvas.style.imageRendering = "pixelated";
    figure.append(caption, canvas);
    context.hud(figure);
    const paintSpectrum = () => {
      const context2d = canvas.getContext("2d");
      if (!context2d) {
        return;
      }
      const image = context2d.createImageData(N, N);
      let max = 1e-12;
      for (let index = 0; index < N * N; index++) {
        max = Math.max(max, Math.hypot(h0.re[index] ?? 0, h0.im[index] ?? 0));
      }
      for (let index = 0; index < N * N; index++) {
        const value = Math.hypot(h0.re[index] ?? 0, h0.im[index] ?? 0) / max;
        const v = Math.max(0, 1 + Math.log10(value + 1e-6) / 3);
        image.data[index * 4] = v * 90;
        image.data[index * 4 + 1] = v * 200;
        image.data[index * 4 + 2] = v * 255;
        image.data[index * 4 + 3] = 255;
      }
      context2d.putImageData(image, 0, 0);
    };

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        const wind = Number(params["wind"]);
        const direction = (Number(params["direction"]) * Math.PI) / 180;
        const key = `${wind}:${direction}`;
        if (key !== spectrumKey) {
          spectrumKey = key;
          buildSpectrum(wind, direction);
          paintSpectrum();
        }
        evolve(time, Number(params["choppy"]));
        tilesUniform.value = params["tiles"] === true ? 1 : 0;
        context.readout("重ね合わせた波", `${(N * N).toLocaleString()} 個`);
        context.readout(
          "うねりの大きさの目安 V²/g",
          `${((wind * wind) / GRAVITY).toFixed(1)} m`
        );
        context.caption(
          "風速と風向きから、どの長さ・向きの波がどれだけ強いか（スペクトル）が決まる。それぞれの波を時間とともに回し、逆 FFT で 4,096 個の波を一度に足し合わせて海面の高さにする。"
        );
      },
    };
  },
};
