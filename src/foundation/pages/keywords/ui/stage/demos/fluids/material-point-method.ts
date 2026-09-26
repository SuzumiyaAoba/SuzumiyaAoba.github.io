import { Color, Vector3 } from "three";
import { rng } from "../../kit";
import { particleView } from "../../particleFluid";
import type { DemoModule } from "../../types";

const GRID = 64;
const DX = 1 / GRID;
const INV_DX = GRID;
const DT = 1.6e-4;
const P_VOL = (DX * 0.5) ** 2;
const P_MASS = P_VOL;
const NU = 0.2;
const WORLD = 2.6;
const ORIGIN = new Vector3(-WORLD / 2, 0, 0);
const WATER = 0;
const JELLY = 1;
const SNOW = 2;
const PER_BLOCK = 1100;
const COUNT = PER_BLOCK * 3;

const MATERIALS = [
  { name: "水", color: "#4f9dff" },
  { name: "ゼリー", color: "#ff7aa8" },
  { name: "雪", color: "#eef4ff" },
] as const;

/** 2×2 行列 [a b; c d] の特異値分解 A = U Σ Vᵀ（U と Vᵀ は回転角で返す）。 */
function svd2(a: number, b: number, c: number, d: number) {
  const e = (a + d) / 2;
  const f = (a - d) / 2;
  const g = (c + b) / 2;
  const h = (c - b) / 2;
  const q = Math.hypot(e, h);
  const r = Math.hypot(f, g);
  const a1 = Math.atan2(g, f);
  const a2 = Math.atan2(h, e);
  return { s1: q + r, s2: q - r, phi: (a2 + a1) / 2, theta: (a2 - a1) / 2 };
}

export const demo: DemoModule = {
  alt: "水・ゼリー・雪の 3 種類の材料を、同じ MPM（物質点法）で計算するデモ。材料は粒子として運ばれ、粒子ごとに「どれだけ変形したか」を覚えている。毎ステップ、粒子の質量と速度を格子に集め、格子の上で力と衝突を計算してから、粒子へ戻す。変形に対する応力の決め方だけを変えると、水は流れ、ゼリーは弾んで元に戻り、雪は固まったり崩れたりする。",
  camera: { position: [0, 1.3, 4.4], target: [0, 1.3, 0], orbit: false },
  controls: [
    { type: "button", key: "drop", label: "落とす" },
    {
      type: "range",
      key: "stiffness",
      label: "硬さ（ヤング率）",
      min: 1000,
      max: 12_000,
      step: 100,
      value: 5000,
    },
    {
      type: "range",
      key: "hardening",
      label: "雪の固まりやすさ",
      min: 0,
      max: 20,
      step: 0.5,
      value: 10,
      hint: "押し固められた雪ほど硬くなる度合いです。",
    },
  ],
  legend: MATERIALS.map(({ name, color }) => ({ color, label: name })),
  setup(context) {
    const { params } = context;
    const random = rng(9);
    const x = new Float64Array(COUNT * 2);
    const v = new Float64Array(COUNT * 2);
    const affine = new Float64Array(COUNT * 4); // C（速度の傾き）
    const deformation = new Float64Array(COUNT * 4); // F（変形勾配）
    const jp = new Float64Array(COUNT); // 塑性による体積変化（雪）
    const material = new Uint8Array(COUNT);
    const gridV = new Float64Array((GRID + 1) * (GRID + 1) * 2);
    const gridM = new Float64Array((GRID + 1) * (GRID + 1));
    const view = particleView(context, {
      capacity: COUNT,
      width: WORLD,
      height: WORLD,
      origin: ORIGIN,
      particleRadius: 0.012,
    });
    const colors = MATERIALS.map(({ color }) => new Color(color));

    const drop = () => {
      const blocks = [
        { cx: 0.25, cy: 0.5 },
        { cx: 0.62, cy: 0.8 },
        { cx: 0.74, cy: 0.3 },
      ];
      for (let p = 0; p < COUNT; p++) {
        const kind = Math.floor(p / PER_BLOCK);
        const block = blocks[kind] ?? blocks[0];
        x[2 * p] = (block?.cx ?? 0.5) + (random() - 0.5) * 0.2;
        x[2 * p + 1] = (block?.cy ?? 0.5) + (random() - 0.5) * 0.2;
        v[2 * p] = 0;
        v[2 * p + 1] = kind === JELLY ? -1 : 0;
        material[p] = kind;
        affine.fill(0, 4 * p, 4 * p + 4);
        deformation[4 * p] = 1;
        deformation[4 * p + 1] = 0;
        deformation[4 * p + 2] = 0;
        deformation[4 * p + 3] = 1;
        jp[p] = 1;
      }
    };
    drop();

    const step = (youngs: number, hardening: number) => {
      const mu0 = youngs / (2 * (1 + NU));
      const lambda0 = (youngs * NU) / ((1 + NU) * (1 - 2 * NU));
      gridV.fill(0);
      gridM.fill(0);
      // 1. 粒子 → 格子：質量と運動量（応力による力も）を周りの 3×3 の格子点に配る
      for (let p = 0; p < COUNT; p++) {
        const px = (x[2 * p] ?? 0) * INV_DX;
        const py = (x[2 * p + 1] ?? 0) * INV_DX;
        const bx = Math.floor(px - 0.5);
        const by = Math.floor(py - 0.5);
        const fx = px - bx;
        const fy = py - by;
        const wx = [
          0.5 * (1.5 - fx) ** 2,
          0.75 - (fx - 1) ** 2,
          0.5 * (fx - 0.5) ** 2,
        ];
        const wy = [
          0.5 * (1.5 - fy) ** 2,
          0.75 - (fy - 1) ** 2,
          0.5 * (fy - 0.5) ** 2,
        ];
        // 変形勾配の更新：F ← (I + dt·C) F
        const c00 = affine[4 * p] ?? 0;
        const c01 = affine[4 * p + 1] ?? 0;
        const c10 = affine[4 * p + 2] ?? 0;
        const c11 = affine[4 * p + 3] ?? 0;
        const f00 = deformation[4 * p] ?? 1;
        const f01 = deformation[4 * p + 1] ?? 0;
        const f10 = deformation[4 * p + 2] ?? 0;
        const f11 = deformation[4 * p + 3] ?? 1;
        let n00 = (1 + DT * c00) * f00 + DT * c01 * f10;
        let n01 = (1 + DT * c00) * f01 + DT * c01 * f11;
        let n10 = DT * c10 * f00 + (1 + DT * c11) * f10;
        let n11 = DT * c10 * f01 + (1 + DT * c11) * f11;
        const kind = material[p] ?? WATER;
        // 材料ごとの硬さ：雪は押し固められるほど硬くなる
        let hardness = Math.exp(hardening * (1 - (jp[p] ?? 1)));
        if (kind === JELLY) {
          hardness = 0.3;
        }
        const mu = kind === WATER ? 0 : mu0 * hardness;
        const lambda = lambda0 * hardness;
        const { s1, s2, phi, theta } = svd2(n00, n01, n10, n11);
        let sig1 = s1;
        let sig2 = s2;
        if (kind === SNOW) {
          // 雪：伸び縮みが限度を超えた分は元に戻らない（塑性）
          const clamped1 = Math.min(Math.max(s1, 1 - 2.5e-2), 1 + 4.5e-3);
          const clamped2 = Math.min(Math.max(s2, 1 - 2.5e-2), 1 + 4.5e-3);
          jp[p] = (jp[p] ?? 1) * (s1 / clamped1) * (s2 / clamped2);
          sig1 = clamped1;
          sig2 = clamped2;
        }
        const J = sig1 * sig2;
        const cu = Math.cos(phi);
        const su = Math.sin(phi);
        const cv = Math.cos(theta);
        const sv = Math.sin(theta);
        // R = U Vᵀ（変形から回転だけを取り出したもの）
        const r00 = cu * cv - su * sv;
        const r01 = -(cu * sv + su * cv);
        const r10 = su * cv + cu * sv;
        const r11 = cu * cv - su * sv;
        if (kind === WATER) {
          // 水：形は覚えず、体積の変化だけを覚える
          const root = Math.sqrt(Math.abs(J));
          n00 = root;
          n01 = 0;
          n10 = 0;
          n11 = root;
        } else if (kind === SNOW) {
          // F = U Σ Vᵀ を、限度内に収めた Σ で組み立て直す
          const a00 = cu * sig1;
          const a01 = -su * sig2;
          const a10 = su * sig1;
          const a11 = cu * sig2;
          n00 = a00 * cv + a01 * sv;
          n01 = -a00 * sv + a01 * cv;
          n10 = a10 * cv + a11 * sv;
          n11 = -a10 * sv + a11 * cv;
        }
        deformation[4 * p] = n00;
        deformation[4 * p + 1] = n01;
        deformation[4 * p + 2] = n10;
        deformation[4 * p + 3] = n11;
        // 応力（固定共回転モデル）：2μ(F − R)Fᵀ + λJ(J − 1)I
        const d00 = n00 - r00;
        const d01 = n01 - r01;
        const d10 = n10 - r10;
        const d11 = n11 - r11;
        const scale = -DT * P_VOL * 4 * INV_DX * INV_DX;
        const s00 =
          scale * (2 * mu * (d00 * n00 + d01 * n01) + lambda * J * (J - 1)) +
          P_MASS * c00;
        const s01 = scale * (2 * mu * (d00 * n10 + d01 * n11)) + P_MASS * c01;
        const s10 = scale * (2 * mu * (d10 * n00 + d11 * n01)) + P_MASS * c10;
        const s11 =
          scale * (2 * mu * (d10 * n10 + d11 * n11) + lambda * J * (J - 1)) +
          P_MASS * c11;
        const vx = v[2 * p] ?? 0;
        const vy = v[2 * p + 1] ?? 0;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const dpx = (i - fx) * DX;
            const dpy = (j - fy) * DX;
            const weight = (wx[i] ?? 0) * (wy[j] ?? 0);
            const node = (bx + i) * (GRID + 1) + (by + j);
            if (node < 0 || node >= gridM.length) {
              continue;
            }
            gridV[2 * node] =
              (gridV[2 * node] ?? 0) +
              weight * (P_MASS * vx + s00 * dpx + s01 * dpy);
            gridV[2 * node + 1] =
              (gridV[2 * node + 1] ?? 0) +
              weight * (P_MASS * vy + s10 * dpx + s11 * dpy);
            gridM[node] = (gridM[node] ?? 0) + weight * P_MASS;
          }
        }
      }
      // 2. 格子：運動量を質量で割って速度にし、重力と壁を扱う
      for (let i = 0; i <= GRID; i++) {
        for (let j = 0; j <= GRID; j++) {
          const node = i * (GRID + 1) + j;
          const m = gridM[node] ?? 0;
          if (m <= 0) {
            continue;
          }
          let gvx = (gridV[2 * node] ?? 0) / m;
          let gvy = (gridV[2 * node + 1] ?? 0) / m - DT * 50;
          if ((i < 3 && gvx < 0) || (i > GRID - 3 && gvx > 0)) {
            gvx = 0;
          }
          if ((j < 3 && gvy < 0) || (j > GRID - 3 && gvy > 0)) {
            gvy = 0;
          }
          gridV[2 * node] = gvx;
          gridV[2 * node + 1] = gvy;
        }
      }
      // 3. 格子 → 粒子：速度と、その傾き（APIC と同じ C）を集めて粒子を動かす
      for (let p = 0; p < COUNT; p++) {
        const px = (x[2 * p] ?? 0) * INV_DX;
        const py = (x[2 * p + 1] ?? 0) * INV_DX;
        const bx = Math.floor(px - 0.5);
        const by = Math.floor(py - 0.5);
        const fx = px - bx;
        const fy = py - by;
        const wx = [
          0.5 * (1.5 - fx) ** 2,
          0.75 - (fx - 1) ** 2,
          0.5 * (fx - 0.5) ** 2,
        ];
        const wy = [
          0.5 * (1.5 - fy) ** 2,
          0.75 - (fy - 1) ** 2,
          0.5 * (fy - 0.5) ** 2,
        ];
        let nvx = 0;
        let nvy = 0;
        let c00 = 0;
        let c01 = 0;
        let c10 = 0;
        let c11 = 0;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const node = (bx + i) * (GRID + 1) + (by + j);
            if (node < 0 || node >= gridM.length) {
              continue;
            }
            const weight = (wx[i] ?? 0) * (wy[j] ?? 0);
            const gvx = gridV[2 * node] ?? 0;
            const gvy = gridV[2 * node + 1] ?? 0;
            const dpx = i - fx;
            const dpy = j - fy;
            nvx += weight * gvx;
            nvy += weight * gvy;
            c00 += 4 * INV_DX * weight * gvx * dpx;
            c01 += 4 * INV_DX * weight * gvx * dpy;
            c10 += 4 * INV_DX * weight * gvy * dpx;
            c11 += 4 * INV_DX * weight * gvy * dpy;
          }
        }
        v[2 * p] = nvx;
        v[2 * p + 1] = nvy;
        affine[4 * p] = c00 / INV_DX;
        affine[4 * p + 1] = c01 / INV_DX;
        affine[4 * p + 2] = c10 / INV_DX;
        affine[4 * p + 3] = c11 / INV_DX;
        x[2 * p] = Math.min(
          1 - 2 * DX,
          Math.max(2 * DX, (x[2 * p] ?? 0) + DT * nvx)
        );
        x[2 * p + 1] = Math.min(
          1 - 2 * DX,
          Math.max(2 * DX, (x[2 * p + 1] ?? 0) + DT * nvy)
        );
      }
    };

    return {
      action(key) {
        if (key === "drop") {
          drop();
        }
      },
      update({ dt }) {
        if (dt > 0) {
          const youngs = Number(params["stiffness"]);
          const hardening = Number(params["hardening"]);
          for (let s = 0; s < 24; s++) {
            step(youngs, hardening);
          }
        }
        view.update(
          COUNT,
          (p) => [(x[2 * p] ?? 0) * WORLD, (x[2 * p + 1] ?? 0) * WORLD],
          () => 0,
          (p, out) => {
            out
              .copy(colors[material[p] ?? 0] ?? colors[0] ?? out)
              .multiplyScalar(
                material[p] === SNOW ? 0.75 + 0.25 * Math.min(1, jp[p] ?? 1) : 1
              );
          }
        );
        context.readout("粒子", `${COUNT}`);
        context.readout("格子", `${GRID}×${GRID}`);
        context.caption(
          "粒子は材料そのもので、質量・速度・変形の履歴を持つ。毎ステップ、粒子から格子へ質量と運動量を集め、格子の上で重力や壁との衝突を扱い、格子の速度を粒子へ戻す。応力の計算だけを材料ごとに変えれば、流れる水、弾むゼリー、崩れる雪を同じ仕組みで扱える。"
        );
      },
    };
  },
};
