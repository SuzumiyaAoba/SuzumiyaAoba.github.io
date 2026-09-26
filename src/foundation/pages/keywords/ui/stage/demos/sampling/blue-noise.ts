import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const S = 64;
const PANEL = 4.4;

const paint = (
  panel: { canvas: HTMLCanvasElement; texture: CanvasTexture },
  value: (x: number, y: number) => number
) => {
  const context2d = panel.canvas.getContext("2d");
  if (!context2d) {
    return;
  }
  const image = context2d.createImageData(128, 128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const v = Math.max(0, Math.min(1, value(x, y))) * 255;
      const o = (y * 128 + x) * 4;
      image.data[o] = v;
      image.data[o + 1] = v;
      image.data[o + 2] = v;
      image.data[o + 3] = 255;
    }
  }
  context2d.putImageData(image, 0, 0);
  panel.texture.needsUpdate = true;
};

// 左から右へ明るくなるグラデーション
const gradient = (x: number) => x / 127;

/**
 * ボイド・アンド・クラスター法（Ulichney 1993）の簡略版でブルーノイズの順位表を作る。
 * 点の「混み具合」をガウス関数の和で測り、一番すいている所（ボイド）に次の点を置いていく。
 */
function voidAndCluster(size: number, seed: number) {
  const n = size * size;
  const sigma = 1.6;
  const kernel = new Float32Array(n);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.min(x, size - x);
      const dy = Math.min(y, size - y);
      kernel[y * size + x] = Math.exp(
        -(dx * dx + dy * dy) / (2 * sigma * sigma)
      );
    }
  }
  const energy = new Float32Array(n);
  const on = new Uint8Array(n);
  const toggle = (index: number, sign: number) => {
    const px = index % size;
    const py = Math.floor(index / size);
    for (let y = 0; y < size; y++) {
      const ky = (y - py + size) % size;
      for (let x = 0; x < size; x++) {
        const kx = (x - px + size) % size;
        energy[y * size + x] =
          (energy[y * size + x] ?? 0) + sign * (kernel[ky * size + kx] ?? 0);
      }
    }
  };
  const extreme = (wantOn: boolean, pickMax: boolean) => {
    let best = -1;
    let value = pickMax ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    for (let index = 0; index < n; index++) {
      if ((on[index] === 1) !== wantOn) {
        continue;
      }
      const e = energy[index] ?? 0;
      if (pickMax ? e > value : e < value) {
        value = e;
        best = index;
      }
    }
    return best;
  };
  // 最初の点：でたらめに約 10% 置き、混んだ点をすいた所へ移すことを落ち着くまでくり返す
  const random = rng(seed);
  const initial = Math.floor(n * 0.1);
  for (let k = 0; k < initial; k++) {
    let index = Math.floor(random() * n);
    while (on[index] === 1) {
      index = Math.floor(random() * n);
    }
    on[index] = 1;
    toggle(index, 1);
  }
  for (let guard = 0; guard < n; guard++) {
    const cluster = extreme(true, true);
    on[cluster] = 0;
    toggle(cluster, -1);
    const hole = extreme(false, false);
    on[hole] = 1;
    toggle(hole, 1);
    if (hole === cluster) {
      break;
    }
  }
  const rank = new Float32Array(n);
  const saved = Uint8Array.from(on);
  const savedEnergy = Float32Array.from(energy);
  // 前半：最初の点を、混んだ所から順に取り除きながら順位を付ける
  for (let k = initial - 1; k >= 0; k--) {
    const cluster = extreme(true, true);
    on[cluster] = 0;
    toggle(cluster, -1);
    rank[cluster] = k;
  }
  on.set(saved);
  energy.set(savedEnergy);
  // 後半：一番すいた所に点を足しながら順位を付ける
  for (let k = initial; k < n; k++) {
    const hole = extreme(false, false);
    on[hole] = 1;
    toggle(hole, 1);
    rank[hole] = k;
  }
  return rank.map((value) => (value + 0.5) / n);
}

/** 2 次元の離散フーリエ変換の大きさ（低い周波数を中心に並べ替え、対数で見やすくする）。 */
function spectrum(values: Float32Array, size: number) {
  const re = new Float32Array(size * size);
  const im = new Float32Array(size * size);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  // 行ごと
  for (let y = 0; y < size; y++) {
    for (let k = 0; k < size; k++) {
      let sr = 0;
      let si = 0;
      for (let x = 0; x < size; x++) {
        const angle = (-2 * Math.PI * k * x) / size;
        const v = (values[y * size + x] ?? 0) - mean;
        sr += v * Math.cos(angle);
        si += v * Math.sin(angle);
      }
      re[y * size + k] = sr;
      im[y * size + k] = si;
    }
  }
  const out = new Float32Array(size * size);
  // 列ごと
  for (let k = 0; k < size; k++) {
    for (let l = 0; l < size; l++) {
      let sr = 0;
      let si = 0;
      for (let y = 0; y < size; y++) {
        const angle = (-2 * Math.PI * l * y) / size;
        const cr = Math.cos(angle);
        const ci = Math.sin(angle);
        const ar = re[y * size + k] ?? 0;
        const ai = im[y * size + k] ?? 0;
        sr += ar * cr - ai * ci;
        si += ar * ci + ai * cr;
      }
      const sx = (k + size / 2) % size;
      const sy = (l + size / 2) % size;
      out[sy * size + sx] = Math.log(1 + Math.hypot(sr, si));
    }
  }
  const max = Math.max(...out);
  return out.map((value) => value / (max || 1));
}

export const demo: DemoModule = {
  alt: "ふつうの乱数（白色雑音）と、ブルーノイズを並べて比べるデモ。ブルーノイズは、近い所に同じような値が固まらないよう、細かい粒がまんべんなく散らばった乱数の表で、周波数で見ると低い周波数（大きなむら）がほとんどない。グラデーションを白と黒の点だけで表す（ディザ）と、白色雑音はざらざらしたむらが目立つが、ブルーノイズは細かく均一に見える。毎フレーム値をずらして時間方向にも平均すると、ブルーノイズの方が少ないフレーム数で正しい色に近づく。",
  camera: { position: [0, 0, 11], target: [0, 0, 0], orbit: false, fov: 40 },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "view",
      label: "見るもの",
      value: "dither",
      options: [
        { value: "pattern", label: "乱数の表そのもの" },
        { value: "dither", label: "グラデーションのディザ（白黒 2 値）" },
        { value: "spectrum", label: "周波数（パワースペクトル）" },
        { value: "temporal", label: "時間方向に平均（毎フレームずらす）" },
      ],
    },
    {
      type: "range",
      key: "points",
      label: "しきい値（点の割合）",
      min: 0.02,
      max: 0.98,
      step: 0.01,
      value: 0.5,
    },
    { type: "button", key: "restart", label: "時間方向の平均をやり直す" },
  ],
  legend: [
    { color: palette.coral, label: "白色雑音（ふつうの乱数）の誤差" },
    { color: palette.sky, label: "ブルーノイズの誤差" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(3);
    const white = new Float32Array(S * S).map(() => random());
    const blue = voidAndCluster(S, 7);
    const whiteSpectrum = spectrum(white, S);
    const blueSpectrum = spectrum(blue, S);

    const makePanel = (x: number, name: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const texture = new CanvasTexture(canvas);
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.colorSpace = SRGBColorSpace;
      const mesh = new Mesh(
        new PlaneGeometry(PANEL, PANEL),
        new MeshBasicMaterial({ map: texture })
      );
      mesh.position.set(x, 0.35, 0);
      scene.add(mesh);
      const label = context.label(name, { tone: "strong" });
      label.position.set(x, 0.35 - PANEL / 2 - 0.4, 0);
      scene.add(label);
      return { canvas, texture };
    };
    const left = makePanel(-PANEL / 2 - 0.35, "白色雑音（ふつうの乱数）");
    const right = makePanel(PANEL / 2 + 0.35, "ブルーノイズ");
    const graph = historyGraph(context, {
      title: "平均した色の誤差（フレームごと）",
      min: 0,
      max: 0.35,
      length: 120,
      series: [{ color: palette.coral }, { color: palette.sky }],
    });

    const accumulate = {
      white: new Float32Array(128 * 128),
      blue: new Float32Array(128 * 128),
      frames: 0,
    };
    const noiseAt = (table: Float32Array, x: number, y: number) =>
      table[(y % S) * S + (x % S)] ?? 0;

    let signature = "";
    const phi = 0.61803398875;
    const random2 = rng(11);
    return {
      action(key) {
        if (key === "restart") {
          accumulate.white.fill(0);
          accumulate.blue.fill(0);
          accumulate.frames = 0;
          graph.clear();
        }
      },
      update() {
        const view = String(params["view"]);
        const threshold = Number(params["points"]);
        const key = `${view}|${threshold}`;
        if (view === "temporal") {
          // 毎フレーム、しきい値の表をずらして 2 値化し、結果を平均していく
          const frame = accumulate.frames;
          let errorWhite = 0;
          let errorBlue = 0;
          for (let y = 0; y < 128; y++) {
            for (let x = 0; x < 128; x++) {
              const index = y * 128 + x;
              const g = gradient(x);
              const w = g > random2() ? 1 : 0;
              const b = g > (noiseAt(blue, x, y) + frame * phi) % 1 ? 1 : 0;
              accumulate.white[index] = (accumulate.white[index] ?? 0) + w;
              accumulate.blue[index] = (accumulate.blue[index] ?? 0) + b;
            }
          }
          accumulate.frames++;
          const { frames } = accumulate;
          for (let index = 0; index < 128 * 128; index++) {
            const g = gradient(index % 128);
            errorWhite += ((accumulate.white[index] ?? 0) / frames - g) ** 2;
            errorBlue += ((accumulate.blue[index] ?? 0) / frames - g) ** 2;
          }
          errorWhite = Math.sqrt(errorWhite / (128 * 128));
          errorBlue = Math.sqrt(errorBlue / (128 * 128));
          if (frames <= 120) {
            graph.push([errorWhite, errorBlue]);
          }
          paint(left, (x, y) => (accumulate.white[y * 128 + x] ?? 0) / frames);
          paint(right, (x, y) => (accumulate.blue[y * 128 + x] ?? 0) / frames);
          graph.setVisible(true);
          context.readout("平均したフレーム数", `${frames}`);
          context.readout(
            "誤差（白色雑音 / ブルーノイズ）",
            `${errorWhite.toFixed(3)} / ${errorBlue.toFixed(3)}`
          );
          context.caption(
            "毎フレーム、白色雑音は新しい乱数で、ブルーノイズは表の値を黄金比ずつずらして 2 値化し、結果を平均する（TAA などの時間方向の積み重ね）。ブルーノイズは空間でも時間でも偏りが少ないので、少ないフレーム数で正しいグラデーションに近づく。"
          );
          signature = "";
          return;
        }
        graph.setVisible(false);
        context.readout("平均したフレーム数", "");
        context.readout("誤差（白色雑音 / ブルーノイズ）", "");
        if (key === signature) {
          return;
        }
        signature = key;
        accumulate.white.fill(0);
        accumulate.blue.fill(0);
        accumulate.frames = 0;
        graph.clear();
        if (view === "pattern") {
          paint(left, (x, y) => (noiseAt(white, x, y) < threshold ? 1 : 0));
          paint(right, (x, y) => (noiseAt(blue, x, y) < threshold ? 1 : 0));
          context.caption(
            "値が「しきい値」より小さい所を白くした。白色雑音は、点が固まった所とすき間が混ざる。ブルーノイズは、点がほぼ同じ間隔で散らばり、どの割合で切っても均一になる。"
          );
        } else if (view === "spectrum") {
          paint(
            left,
            (x, y) =>
              whiteSpectrum[Math.floor(y / 2) * S + Math.floor(x / 2)] ?? 0
          );
          paint(
            right,
            (x, y) =>
              blueSpectrum[Math.floor(y / 2) * S + Math.floor(x / 2)] ?? 0
          );
          context.caption(
            "中心が低い周波数（大きなむら）、外側が高い周波数（細かい粒）。白色雑音はどの周波数も同じくらい含む。ブルーノイズは中心が暗い（低い周波数がない）ので、大きなむらとして目につく成分がない。"
          );
        } else {
          paint(left, (x, y) => (gradient(x) > noiseAt(white, x, y) ? 1 : 0));
          paint(right, (x, y) => (gradient(x) > noiseAt(blue, x, y) ? 1 : 0));
          context.caption(
            "左から右へ明るくなるグラデーションを、白と黒の点だけで表した（各画素で乱数の表の値と比べる）。白色雑音は、ざらざらした大きなむらが見える。ブルーノイズは粒が細かく均一なので、少し離れると滑らかなグラデーションに見える。"
          );
        }
      },
    };
  },
};
