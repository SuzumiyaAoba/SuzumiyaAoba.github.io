import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  BoxGeometry,
  Color,
  LinearToneMapping,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  ReinhardToneMapping,
  ShaderMaterial,
  SpotLight,
} from "three";
import type { ToneMapping } from "three";
import { palette } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const operators: Record<
  string,
  { label: string; mapping: ToneMapping; curve: (x: number) => number }
> = {
  none: {
    label: "なし（1 で切り捨て）",
    mapping: LinearToneMapping,
    curve: (x) => Math.min(x, 1),
  },
  reinhard: {
    label: "Reinhard",
    mapping: ReinhardToneMapping,
    curve: (x) => x / (1 + x),
  },
  aces: {
    label: "ACES Filmic",
    mapping: ACESFilmicToneMapping,
    curve: (x) => {
      const v = x * 0.6;
      return Math.min(
        1,
        (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14)
      );
    },
  },
  agx: {
    label: "AgX",
    mapping: AgXToneMapping,
    curve: (x) => {
      const log = Math.min(
        1,
        Math.max(0, (Math.log2(Math.max(x, 1e-6)) + 12.47) / 16.5)
      );
      return log * log * (3 - 2 * log) ** 1.2 * 0.98;
    },
  },
  neutral: {
    label: "Khronos PBR Neutral",
    mapping: NeutralToneMapping,
    curve: (x) => {
      const start = 0.76;
      if (x < start) {
        return x;
      }
      const d = 1 - start;
      return 1 - (d * d) / (x + d - start);
    },
  },
};

export const demo: DemoModule = {
  alt: "とても明るい照明とネオンが混ざった夜の広場を、いくつかのトーンマッピングで画面の明るさに変換して比べるデモ。計算上の明るさは 1 をはるかに超えるが、画面は 0〜1 しか表示できない。そのまま切り捨てると明るい部分が真っ白に飛んで色も形も失われる。フィルム調の曲線でなめらかに圧縮すると、明るい部分の階調と色が残る。",
  camera: { position: [0, 2.2, 7.5], target: [0, 1.8, -4] },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "select",
      key: "operator",
      label: "トーンマッピング",
      value: "aces",
      options: Object.entries(operators).map(([value, { label }]) => ({
        value,
        label,
      })),
    },
    {
      type: "range",
      key: "exposure",
      label: "露出（段）",
      min: -3,
      max: 3,
      step: 0.1,
      value: 0,
      format: (value) => `${value > 0 ? "+" : ""}${value.toFixed(1)} EV`,
    },
    {
      type: "toggle",
      key: "clip",
      label: "白飛びした画素を表示",
      value: false,
      hint: "表示できる最大の明るさに張り付いた画素を赤い斜線で示します。",
    },
  ],
  legend: [{ color: palette.coral, label: "白飛び（1 に張り付いた画素）" }],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    // 非常に明るい照明：投光器と、強く光るパネル
    const flood = new SpotLight("#fff1dc", 900, 30, 0.45, 0.4, 1.6);
    flood.position.set(-4, 7, 3);
    flood.target.position.set(0.5, 0, -1);
    flood.castShadow = true;
    scene.add(flood, flood.target);
    const panel = new Mesh(
      new BoxGeometry(2.4, 1.2, 0.1),
      new MeshStandardMaterial({
        color: "#000000",
        emissive: new Color("#ffe7c4"),
        emissiveIntensity: 40,
      })
    );
    panel.position.set(3.2, 5.2, -6);
    scene.add(panel);

    const previousMapping = renderer.toneMapping;
    const previousExposure = renderer.toneMappingExposure;
    const sceneTarget = screenTarget(context);
    const uniforms = {
      uScene: { value: sceneTarget.texture },
      uClip: { value: 0 },
      uExposure: { value: 1 },
    };
    const pass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uScene;
          uniform float uClip;
          uniform float uExposure;
          varying vec2 vUv;
          void main() {
            vec3 hdr = texture2D(uScene, vUv).rgb * uExposure;
            gl_FragColor = vec4(hdr, 1.0);
            #include <tonemapping_fragment>
            float clipped = step(0.995, max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)));
            float stripes = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / 10.0));
            gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.15, 0.1), clipped * stripes * uClip);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    context.setRender(() => {
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);
      pass.render(renderer, null);
    });

    const graph = hudGraph(context, {
      title: "入力の明るさ（横：2⁻⁶〜2⁶、対数）→ 画面の明るさ（縦）",
      xLabel: "明るい →",
    });
    let drawn = "";
    let time = 0;

    return {
      update({ dt }) {
        time += dt;
        showcase.update(time);
        const key = String(params["operator"]);
        const operator = operators[key] ?? operators["aces"];
        const exposure = 2 ** Number(params["exposure"]);
        if (operator) {
          renderer.toneMapping = operator.mapping;
        }
        // 露出はシェーダー側で掛ける（トーンマッピングの前）
        renderer.toneMappingExposure = 1;
        uniforms.uExposure.value = exposure;
        uniforms.uClip.value = params["clip"] === true ? 1 : 0;
        const signature = `${key}:${exposure}`;
        if (signature !== drawn && operator) {
          drawn = signature;
          graph.setSeries([
            {
              fn: (t) => Math.min(1, 2 ** (-6 + t * 12) * exposure),
              color: palette.muted,
              label: "切り捨て",
              dashed: true,
            },
            {
              fn: (t) => operator.curve(2 ** (-6 + t * 12) * exposure),
              color: palette.amber,
              label: operator.label,
            },
          ]);
        }
        graph.setMarker(0.5);
        context.readout("露出", `×${exposure.toFixed(2)}`);
        context.caption(
          key === "none"
            ? "トーンマッピングなし：1 を超えた明るさはすべて同じ白になる。ネオンや投光器の当たった床は真っ白に飛び、色も形も分からない。"
            : "フィルム調の曲線は、暗い部分はほぼそのまま、明るくなるほど緩やかに圧縮して 1 に近づける。明るい部分にも階調が残り、光の色も分かる。"
        );
      },
      dispose() {
        renderer.toneMapping = previousMapping;
        renderer.toneMappingExposure = previousExposure;
      },
    };
  },
};
