import { palette } from "../../kit";
import { distanceSection, glslSdf, raymarchWorld } from "../../raymarch";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

/** 多項式スムーズ最小値（Inigo Quilez）。h は a 側の重み。 */
const smoothMin = (a: number, b: number, k: number) => {
  if (k <= 1e-4) {
    return Math.min(a, b);
  }
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
};

const blobGlsl = /* glsl */ `
  ${glslSdf}
  // 距離と色を同時に滑らかに合成する
  vec4 blend(vec4 a, vec4 b, float k) {
    if (k < 1e-4) return a.w < b.w ? a : b;
    float h = clamp(0.5 + 0.5 * (b.w - a.w) / k, 0.0, 1.0);
    float d = mix(b.w, a.w, h) - k * h * (1.0 - h);
    return vec4(mix(b.rgb, a.rgb, h), d);
  }
  vec4 slime(vec3 p) {
    float t = uTime;
    vec4 body = vec4(0.25, 0.85, 0.78, sdSphere(p - vec3(-0.55, 0.72, 0.0), 0.72));
    vec4 buddy = vec4(0.96, 0.52, 0.76, sdSphere(p - vec3(0.55 + 0.35 * sin(t * 0.8), 0.62 + 0.18 * sin(t * 1.3), 0.0), 0.5));
    vec4 drop = vec4(0.98, 0.74, 0.32, sdSphere(p - vec3(-0.35, 1.85 + 0.42 * sin(t * 0.9), 0.0), 0.26));
    vec4 arm = vec4(0.25, 0.85, 0.78, sdCapsule(p, vec3(-0.9, 0.9, 0.0), vec3(-1.55, 1.25 + 0.2 * sin(t * 1.7), 0.0), 0.14));
    vec4 d = blend(body, buddy, uK);
    d = blend(d, drop, uK);
    d = blend(d, arm, uK);
    if (uFloorBlend > 0.5) {
      d = blend(d, vec4(0.055, 0.07, 0.095, p.y), uK * 0.8);
    }
    return d;
  }
`;

export const demo: DemoModule = {
  alt: "スライムのような柔らかい塊が、互いに近づくと滑らかにくっつくスムーズユニオンのデモ。普通の和（min）では接合部に鋭い谷ができるが、smooth min を使うと、合成の幅 k の範囲で距離が滑らかに混ざり、肉付きのよい継ぎ目になる。色も同じ重みで混ぜている。",
  camera: { position: [0.4, 1.9, 6.2], target: [0, 1, 0] },
  studio: { floor: false },
  controls: [
    {
      type: "range",
      key: "k",
      label: "合成の幅 k",
      min: 0,
      max: 1.2,
      step: 0.01,
      value: 0.45,
      hint: "0 にすると普通の min（和）になります。",
    },
    {
      type: "toggle",
      key: "floor",
      label: "床ともなめらかにつなぐ",
      value: true,
    },
    {
      type: "toggle",
      key: "section",
      label: "断面の距離を表示",
      value: false,
      hint: "接合部では等距離線の間隔が詰まり、厳密な距離ではなくなっていることが分かります。",
    },
    { type: "toggle", key: "move", label: "動かす", value: true },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uK: { value: 0.45 },
      uFloorBlend: { value: 1 },
      uCut: { value: 0 },
    };
    raymarchWorld(context, {
      uniforms,
      stepScale: 0.85,
      functions: /* glsl */ `
        ${blobGlsl}
        float map(vec3 p) {
          float d = slime(p).w;
          return uCut > 0.5 ? max(d, p.z + 0.006) : d;
        }
        vec4 surface(vec3 p, vec3 n) {
          if (uCut > 0.5 && p.z > -0.01) return vec4(0.16, 0.2, 0.26, 0.8);
          return vec4(slime(p).rgb, 0.18);
        }
      `,
    });
    const section = distanceSection({
      width: 5.6,
      height: 3.2,
      spacing: 0.1,
      uniforms,
      functions: /* glsl */ `
        ${blobGlsl}
        float sectionDistance(vec3 p) { return slime(vec3(p.xy, 0.0)).w; }
      `,
    });
    section.position.set(0, 1.5, 0.004);
    scene.add(section);

    const graph = hudGraph(context, {
      title: "min(x, 0) と smooth min（x = dA − dB）",
      min: -0.7,
      max: 0.1,
      xLabel: "x",
    });
    const drawGraph = (k: number) => {
      graph.setSeries([
        {
          fn: (t) => Math.min((t * 2 - 1) * 0.6, 0),
          color: palette.cyan,
          label: "min",
          dashed: true,
        },
        {
          fn: (t) => smoothMin((t * 2 - 1) * 0.6, 0, k),
          color: palette.amber,
          label: "smooth min",
        },
      ]);
      graph.setMarker(0.5);
    };
    let drawnK = -1;
    let time = 0;

    return {
      update({ dt }) {
        if (params["move"] === true) {
          time += dt;
        }
        const k = Number(params["k"]);
        uniforms.uTime.value = time;
        uniforms.uK.value = k;
        uniforms.uFloorBlend.value = params["floor"] === true ? 1 : 0;
        const showSection = params["section"] === true;
        uniforms.uCut.value = showSection ? 1 : 0;
        section.visible = showSection;
        if (k !== drawnK) {
          drawnK = k;
          drawGraph(k);
        }
        context.readout("合成の幅 k", k.toFixed(2));
        context.readout("接合部の最大のへこみ", `${(k / 4).toFixed(3)} m`);
        context.caption(
          k < 0.01
            ? "普通の min では、2 つの形の境目に鋭い谷（折れ目）ができる。"
            : "距離の差が k より小さい範囲だけ、2 つの距離を混ぜて少し引く。遠く離れていれば普通の min と同じで、近づくと肉が盛られてつながる。"
        );
      },
    };
  },
};
