import { ShaderMaterial, Vector2 } from "three";
import { palette } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  renderNormals,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

const sources = { both: 0, depth: 1, normal: 2 } as const;
type Source = keyof typeof sources;
const isSource = (value: unknown): value is Source =>
  typeof value === "string" && Object.hasOwn(sources, value);

const styles = { overlay: 0, ink: 1, edges: 2 } as const;
type Style = keyof typeof styles;
const isStyle = (value: unknown): value is Style =>
  typeof value === "string" && Object.hasOwn(styles, value);

export const demo: DemoModule = {
  alt: "描いた画面の深度（カメラからの距離）と法線（面の向き）を隣の画素と比べ、差が大きい場所に線を引く輪郭検出のデモ。深度の差は物の外形（手前と奥の境目）を、法線の差は同じ物の中の折れ目や角を見つける。線だけを取り出して紙の上に描くと、漫画や設計図のような表現になる。",
  camera: { position: [0, 2.2, 7.5], target: [0, 1.8, -4] },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "select",
      key: "source",
      label: "線の検出に使う情報",
      value: "both",
      options: [
        { value: "both", label: "深度 + 法線" },
        { value: "depth", label: "深度のみ" },
        { value: "normal", label: "法線のみ" },
      ],
    },
    {
      type: "select",
      key: "style",
      label: "表示",
      value: "ink",
      options: [
        { value: "overlay", label: "画面に重ねる" },
        { value: "ink", label: "インクの線画" },
        { value: "edges", label: "検出結果のみ" },
      ],
    },
    {
      type: "range",
      key: "depthThreshold",
      label: "深度のしきい値",
      min: 0.002,
      max: 0.1,
      step: 0.001,
      value: 0.02,
    },
    {
      type: "range",
      key: "normalThreshold",
      label: "法線のしきい値",
      min: 0.05,
      max: 1,
      step: 0.01,
      value: 0.35,
    },
    {
      type: "range",
      key: "width",
      label: "線の太さ",
      min: 0.5,
      max: 3,
      step: 0.1,
      value: 1.2,
    },
  ],
  legend: [
    { color: palette.coral, label: "深度の差（外形）" },
    { color: palette.cyan, label: "法線の差（折れ目）" },
  ],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    const colorTarget = screenTarget(context, { depth: true });
    const normalTarget = screenTarget(context, { float: false });
    const uniforms = {
      uColor: { value: colorTarget.texture },
      uDepth: { value: colorTarget.depthTexture },
      uNormal: { value: normalTarget.texture },
      uTexel: { value: new Vector2() },
      uNear: { value: camera.near },
      uFar: { value: camera.far },
      uSource: { value: 0 },
      uStyle: { value: 1 },
      uDepthThreshold: { value: 0.02 },
      uNormalThreshold: { value: 0.35 },
      uWidth: { value: 1.2 },
    };
    const pass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uColor;
          uniform sampler2D uDepth;
          uniform sampler2D uNormal;
          uniform vec2 uTexel;
          uniform float uNear;
          uniform float uFar;
          uniform float uSource;
          uniform float uStyle;
          uniform float uDepthThreshold;
          uniform float uNormalThreshold;
          uniform float uWidth;
          varying vec2 vUv;
          float linearDepth(vec2 uv) {
            float d = texture2D(uDepth, uv).r;
            return (uNear * uFar) / (uFar - d * (uFar - uNear));
          }
          vec3 normalAt(vec2 uv) { return texture2D(uNormal, uv).rgb * 2.0 - 1.0; }
          void main() {
            vec2 o = uTexel * uWidth;
            // 斜めの 2 組の近傍と比べる
            float d0 = linearDepth(vUv);
            float d1 = linearDepth(vUv + o);
            float d2 = linearDepth(vUv + vec2(o.x, -o.y));
            float d3 = linearDepth(vUv - o);
            float d4 = linearDepth(vUv - vec2(o.x, -o.y));
            // 平面では 1/深度 が画面上で直線的に変わるので、2 階差分は 0 になる。
            // 斜めに見た床を誤検出せず、前後の段差だけを線にできる
            float w0 = 1.0 / d0;
            float depthEdge = (abs(1.0 / d1 + 1.0 / d3 - 2.0 * w0) + abs(1.0 / d2 + 1.0 / d4 - 2.0 * w0)) / w0;
            vec3 n1 = normalAt(vUv + o);
            vec3 n2 = normalAt(vUv + vec2(o.x, -o.y));
            vec3 n3 = normalAt(vUv - o);
            vec3 n4 = normalAt(vUv - vec2(o.x, -o.y));
            float normalEdge = length(n1 - n3) + length(n2 - n4);
            float depthLine = uSource > 1.5 ? 0.0 : smoothstep(uDepthThreshold, uDepthThreshold * 1.5, depthEdge);
            float normalLine = uSource > 0.5 && uSource < 1.5 ? 0.0 : smoothstep(uNormalThreshold, uNormalThreshold * 1.4, normalEdge);
            float line = max(depthLine, normalLine);
            vec3 scene = texture2D(uColor, vUv).rgb;
            vec3 color;
            if (uStyle < 0.5) {
              color = mix(toneMapping(scene), vec3(0.0), line);
            } else if (uStyle < 1.5) {
              // 紙の上のインク：明るさを数段に丸めた淡い色の上に線を描く
              float lightness = dot(scene, vec3(0.3, 0.5, 0.2));
              vec3 paper = vec3(0.96, 0.94, 0.88);
              vec3 wash = mix(paper, paper * vec3(0.78, 0.82, 0.9), 1.0 - step(0.06, lightness));
              color = mix(wash, vec3(0.12, 0.12, 0.16), line);
            } else {
              color = vec3(depthLine, 0.0, 0.0) * vec3(0.96, 0.45, 0.43) + vec3(0.0, normalLine, normalLine) * vec3(0.0, 0.84, 0.78);
            }
            gl_FragColor = vec4(color, 1.0);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    const size = new Vector2();
    context.onResize(() => {
      renderer.getDrawingBufferSize(size);
      uniforms.uTexel.value.set(1 / size.x, 1 / size.y);
    });
    context.setRender(() => {
      renderer.setRenderTarget(colorTarget);
      renderer.render(scene, camera);
      renderNormals(renderer, scene, camera, normalTarget);
      pass.render(renderer, null);
    });

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        showcase.update(time);
        const source: Source = isSource(params["source"])
          ? params["source"]
          : "both";
        const style: Style = isStyle(params["style"]) ? params["style"] : "ink";
        uniforms.uSource.value = sources[source];
        uniforms.uStyle.value = styles[style];
        uniforms.uDepthThreshold.value = Number(params["depthThreshold"]);
        uniforms.uNormalThreshold.value = Number(params["normalThreshold"]);
        uniforms.uWidth.value = Number(params["width"]);
        context.caption(
          source === "depth"
            ? "深度の差だけだと、手前と奥の境目（外形）は取れるが、同じ物の中の角や、壁と床のつなぎ目のような折れ目は取れない。"
            : source === "normal"
              ? "法線の差だけだと、面の向きが変わる角や折れ目は取れるが、同じ向きの面が前後に重なる境目は取れない。"
              : "深度の差で外形を、法線の差で折れ目を見つけて合わせると、物の形がよく分かる線になる。"
        );
      },
    };
  },
};
