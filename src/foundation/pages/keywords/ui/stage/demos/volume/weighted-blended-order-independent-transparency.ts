import {
  Color,
  CustomBlending,
  DepthTexture,
  DoubleSide,
  Group,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  OneFactor,
  OneMinusSrcColorFactor,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  WebGLRenderTarget,
  ZeroFactor,
} from "three";
import type { BufferGeometry } from "three";
import { palette, standard } from "../../kit";
import type { DemoModule } from "../../types";

const PANES = [
  { color: "#ff5a5a", angle: 0 },
  { color: "#4ad97a", angle: Math.PI / 4 },
  { color: "#4a8cff", angle: Math.PI / 2 },
  { color: "#ffd24a", angle: (Math.PI * 3) / 4 },
] as const;

const modes = { unsorted: 0, sorted: 1, wboit: 2 } as const;
type Mode = keyof typeof modes;
const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && Object.hasOwn(modes, value);

const vertexShader = /* glsl */ `
  void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/** 重み：手前ほど、不透明度が高いほど大きい（McGuire & Bavoil の式を簡略化）。 */
const weightGlsl = /* glsl */ `
  float oitWeight(float alpha) {
    float z = gl_FragCoord.z;
    return clamp(pow(min(1.0, alpha * 10.0) + 0.01, 3.0) * 1e3 * pow(1.0 - z * 0.9, 3.0), 1e-2, 3e3);
  }
`;

export const demo: DemoModule = {
  alt: "中心で交差する 4 枚の色ガラスと半透明の球を、3 つの方法で描き比べるデモ。半透明の物体は奥から順に重ねる必要があるが、並べ替えなしでは手前の板が奥を消し、物体単位で並べ替えても交差した部分の順序は正しくならず、視点を回すと入れ替わってちらつく。重み付きブレンド OIT は、順序を気にせず色を足し合わせ、深さに応じた重みで平均するので、交差していても破綻しにくい。",
  camera: { position: [3.6, 2.6, 5.4], target: [0, 1.2, 0], autoRotate: 12 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "半透明の描き方",
      value: "wboit",
      options: [
        { value: "unsorted", label: "並べ替えなし" },
        { value: "sorted", label: "物体単位で並べ替え" },
        { value: "wboit", label: "重み付き OIT" },
      ],
    },
    {
      type: "range",
      key: "alpha",
      label: "不透明度",
      min: 0.1,
      max: 0.9,
      step: 0.01,
      value: 0.45,
    },
  ],
  legend: [{ color: palette.muted, label: "視点は自動で回転します" }],
  setup(context) {
    const { scene, params, renderer, camera } = context;
    const pillar = new Mesh(
      new SphereGeometry(0.35, 32, 16),
      standard("#d8d2c6")
    );
    pillar.position.set(0, 1.2, 0);
    pillar.castShadow = true;
    scene.add(pillar);

    const paneGeometry = new PlaneGeometry(3, 2);
    const bubbleGeometry = new SphereGeometry(0.28, 32, 16);
    type Item = {
      geometry: BufferGeometry;
      color: string;
      place: (mesh: Mesh) => void;
    };
    const items: Item[] = PANES.map(({ color, angle }) => ({
      geometry: paneGeometry,
      color,
      place: (mesh) => {
        mesh.position.set(0, 1.2, 0);
        mesh.rotation.y = angle;
      },
    }));
    for (let index = 0; index < 8; index++) {
      const angle = (index / 8) * Math.PI * 2;
      items.push({
        geometry: bubbleGeometry,
        color: index % 2 === 0 ? "#ff8ad8" : "#8af0ff",
        place: (mesh) => {
          mesh.position.set(
            Math.cos(angle) * 1.1,
            1.2 + Math.sin(angle * 2) * 0.5,
            Math.sin(angle) * 1.1
          );
        },
      });
    }

    // 普通の半透明（並べ替えなし / 物体単位）
    const basicGroup = new Group();
    const basicMaterials = items.map(({ geometry, color, place }) => {
      const material = new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.45,
        side: DoubleSide,
      });
      const mesh = new Mesh(geometry, material);
      place(mesh);
      basicGroup.add(mesh);
      return material;
    });
    scene.add(basicGroup);

    // 重み付き OIT 用：同じ形を、累積用と透過率用のマテリアルで描く
    const alpha = { value: 0.45 };
    const oitScene = new Scene();
    const accumGroup = new Group();
    const revealGroup = new Group();
    for (const { geometry, color, place } of items) {
      const tint = new Color(color);
      const accum = new Mesh(
        geometry,
        new ShaderMaterial({
          uniforms: { uColor: { value: tint }, uAlpha: alpha },
          vertexShader,
          fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uAlpha;
            ${weightGlsl}
            void main() {
              float w = oitWeight(uAlpha);
              gl_FragColor = vec4(uColor * uAlpha * w, uAlpha * w);
            }
          `,
          side: DoubleSide,
          transparent: true,
          depthWrite: false,
          blending: CustomBlending,
          blendSrc: OneFactor,
          blendDst: OneFactor,
        })
      );
      const reveal = new Mesh(
        geometry,
        new ShaderMaterial({
          uniforms: { uAlpha: alpha },
          vertexShader,
          fragmentShader: /* glsl */ `
            uniform float uAlpha;
            void main() { gl_FragColor = vec4(uAlpha); }
          `,
          side: DoubleSide,
          transparent: true,
          depthWrite: false,
          blending: CustomBlending,
          blendSrc: ZeroFactor,
          blendDst: OneMinusSrcColorFactor,
        })
      );
      place(accum);
      place(reveal);
      accumGroup.add(accum);
      revealGroup.add(reveal);
    }
    oitScene.add(accumGroup, revealGroup);

    const depth = new DepthTexture(1, 1);
    const opaqueTarget = context.track(
      new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthTexture: depth })
    );
    const accumTarget = context.track(
      new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthTexture: depth })
    );
    const revealTarget = context.track(
      new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthTexture: depth })
    );
    const compositeUniforms = {
      uOpaque: { value: opaqueTarget.texture },
      uAccum: { value: accumTarget.texture },
      uReveal: { value: revealTarget.texture },
    };
    const quadScene = new Scene();
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new Mesh(
      new PlaneGeometry(2, 2),
      context.track(
        new ShaderMaterial({
          uniforms: compositeUniforms,
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
          `,
          fragmentShader: /* glsl */ `
            uniform sampler2D uOpaque;
            uniform sampler2D uAccum;
            uniform sampler2D uReveal;
            varying vec2 vUv;
            void main() {
              vec3 opaque = texture2D(uOpaque, vUv).rgb;
              vec4 accum = texture2D(uAccum, vUv);
              float reveal = texture2D(uReveal, vUv).r;
              // 重み付き平均の色を、残った透過率で奥の不透明な画面と合成する
              vec3 average = accum.rgb / max(accum.a, 1e-5);
              gl_FragColor = vec4(average * (1.0 - reveal) + opaque * reveal, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `,
        })
      )
    );
    context.track(quad.geometry);
    quadScene.add(quad);

    const size = new Vector2();
    context.onResize(() => {
      renderer.getDrawingBufferSize(size);
      for (const target of [opaqueTarget, accumTarget, revealTarget]) {
        target.setSize(size.x, size.y);
      }
    });

    const renderWboit = () => {
      basicGroup.visible = false;
      renderer.setRenderTarget(opaqueTarget);
      renderer.render(scene, camera);
      const { autoClear } = renderer;
      renderer.autoClear = false;
      const clearColor = new Color();
      renderer.getClearColor(clearColor);
      const clearAlpha = renderer.getClearAlpha();
      // 累積：色 × 不透明度 × 重み を足し合わせる（初期値 0）
      renderer.setRenderTarget(accumTarget);
      renderer.setClearColor("#000000", 0);
      renderer.clear(true, false, false);
      accumGroup.visible = true;
      revealGroup.visible = false;
      renderer.render(oitScene, camera);
      // 透過率：(1 − 不透明度) を掛け合わせる（初期値 1）
      renderer.setRenderTarget(revealTarget);
      renderer.setClearColor("#ffffff", 1);
      renderer.clear(true, false, false);
      accumGroup.visible = false;
      revealGroup.visible = true;
      renderer.render(oitScene, camera);
      renderer.setClearColor(clearColor, clearAlpha);
      renderer.autoClear = autoClear;
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCamera);
      basicGroup.visible = true;
    };
    const renderDefault = () => {
      renderer.render(scene, camera);
    };
    let current: Mode = "wboit";
    context.setRender(renderWboit);

    return {
      update() {
        const mode: Mode = isMode(params["mode"]) ? params["mode"] : "wboit";
        const opacity = Number(params["alpha"]);
        alpha.value = opacity;
        for (const material of basicMaterials) {
          material.opacity = opacity;
          // 並べ替えなしの典型的な失敗：深度を書き込み、描いた順に重ねる
          material.depthWrite = mode === "unsorted";
        }
        renderer.sortObjects = mode !== "unsorted";
        if (mode !== current) {
          current = mode;
          context.setRender(mode === "wboit" ? renderWboit : renderDefault);
        }
        context.caption(
          mode === "unsorted"
            ? "並べ替えずに描くと、先に描いた手前の板が深度を書き込み、後から描く奥の板が消えてしまう。"
            : mode === "sorted"
              ? "物体の中心の距離で奥から並べ替えても、交差した板は 1 枚の中で手前と奥が入れ替わるので、正しい順序にならない。視点を回すと順序が入れ替わってちらつく。"
              : "描く順序に関係なく、色 × 不透明度 × 重み を足し合わせ、最後に重みで割って平均する。手前ほど重みを大きくするので、交差していても自然に混ざる（近似なので完全には正確でない）。"
        );
      },
      dispose() {
        renderer.sortObjects = true;
      },
    };
  },
};
