import {
  HalfFloatType,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Raycaster,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  TorusGeometry,
  Vector2,
  WebGLRenderTarget,
} from "three";
import type { Texture } from "three";
import { palette } from "../../kit";
import type { DemoModule } from "../../types";

const TEX_W = 512;
const TEX_H = 192;

const PRESETS: Record<string, { feed: number; kill: number; label: string }> = {
  spots: { feed: 0.0367, kill: 0.0649, label: "増える斑点（細胞分裂）" },
  maze: { feed: 0.029, kill: 0.057, label: "迷路・しま模様" },
  coral: { feed: 0.0545, kill: 0.062, label: "サンゴ" },
  holes: { feed: 0.039, kill: 0.058, label: "穴の開いた膜" },
};

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Gray–Scott モデル：A は餌、B は A を食べて増える物質
const simulate = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uState;
  uniform vec2 uTexel;
  uniform float uFeed;
  uniform float uKill;
  void main() {
    vec2 c = texture2D(uState, vUv).rg;
    // 周りとの差（ラプラシアン）：拡散で平らにならそうとする量
    vec2 lap = -c;
    lap += 0.2 * texture2D(uState, vUv + vec2(uTexel.x, 0.0)).rg;
    lap += 0.2 * texture2D(uState, vUv - vec2(uTexel.x, 0.0)).rg;
    lap += 0.2 * texture2D(uState, vUv + vec2(0.0, uTexel.y)).rg;
    lap += 0.2 * texture2D(uState, vUv - vec2(0.0, uTexel.y)).rg;
    lap += 0.05 * texture2D(uState, vUv + uTexel).rg;
    lap += 0.05 * texture2D(uState, vUv - uTexel).rg;
    lap += 0.05 * texture2D(uState, vUv + vec2(uTexel.x, -uTexel.y)).rg;
    lap += 0.05 * texture2D(uState, vUv + vec2(-uTexel.x, uTexel.y)).rg;
    float a = c.r;
    float b = c.g;
    float reaction = a * b * b;
    float na = a + (1.0 * lap.r - reaction + uFeed * (1.0 - a));
    float nb = b + (0.5 * lap.g + reaction - (uKill + uFeed) * b);
    gl_FragColor = vec4(clamp(na, 0.0, 1.0), clamp(nb, 0.0, 1.0), 0.0, 1.0);
  }
`;

const seed = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uState;
  uniform vec2 uPoint;
  uniform float uRadius;
  uniform float uClear;
  uniform float uNoiseSeed;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uNoiseSeed) * 43758.5453); }
  void main() {
    vec2 c = mix(texture2D(uState, vUv).rg, vec2(1.0, 0.0), uClear);
    // 繰り返しの境目をまたいでも丸くなるよう、近い方の差をとる
    vec2 d = vUv - uPoint;
    d -= floor(d + 0.5);
    d.x *= ${(TEX_W / TEX_H).toFixed(3)};
    if (length(d) < uRadius) c.g = 1.0;
    if (uClear > 0.5 && hash(floor(vUv * vec2(${TEX_W / 8}.0, ${TEX_H / 8}.0))) > 0.985) c.g = 1.0;
    gl_FragColor = vec4(c, 0.0, 1.0);
  }
`;

export const demo: DemoModule = {
  alt: "2 つの物質が反応しながら広がる様子から模様が育つ、反応拡散（グレイ・スコット模型）のデモ。物質 A（餌）は外から補給され、物質 B は A を食べて増え、自分も少しずつ消える。2 つの物質の広がる速さの違いから、斑点、しま、迷路、サンゴのような模様が自然に生まれ、ドーナツ形の表面を覆っていく。表面をクリックすると、その場所に B を置いて模様の種をまける。",
  camera: { position: [0, 2.4, 4.2], target: [0, 0.9, 0], autoRotate: 6 },
  controls: [
    {
      type: "select",
      key: "preset",
      label: "模様",
      value: "coral",
      options: Object.entries(PRESETS).map(([value, preset]) => ({
        value,
        label: preset.label,
      })),
    },
    {
      type: "range",
      key: "feed",
      label: "補給の速さ f",
      min: 0.01,
      max: 0.08,
      step: 0.0005,
      value: 0.0545,
      format: (value) => value.toFixed(4),
    },
    {
      type: "range",
      key: "kill",
      label: "消える速さ k",
      min: 0.045,
      max: 0.07,
      step: 0.0005,
      value: 0.062,
      format: (value) => value.toFixed(4),
    },
    {
      type: "range",
      key: "speed",
      label: "1 フレームの計算回数",
      min: 1,
      max: 40,
      step: 1,
      value: 20,
    },
    { type: "button", key: "reset", label: "種をまき直す" },
  ],
  legend: [
    { color: palette.coral, label: "物質 B が多い（盛り上がる）" },
    { color: "#1c2a44", label: "物質 A（餌）だけ" },
  ],
  hint: "表面をクリックすると、その場所に模様の種をまけます。",
  setup(context) {
    const { scene, renderer, params, pointer, camera } = context;
    const makeTarget = () => {
      const target = new WebGLRenderTarget(TEX_W, TEX_H, {
        type: HalfFloatType,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        depthBuffer: false,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
      });
      return context.track(target);
    };
    let read = makeTarget();
    let write = makeTarget();
    const quadScene = new Scene();
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new Mesh(context.track(new PlaneGeometry(2, 2)));
    quad.frustumCulled = false;
    quadScene.add(quad);
    const texel = new Vector2(1 / TEX_W, 1 / TEX_H);
    const simMaterial = context.track(
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: simulate,
        uniforms: {
          uState: { value: read.texture },
          uTexel: { value: texel },
          uFeed: { value: 0.05 },
          uKill: { value: 0.06 },
        },
      })
    );
    const seedMaterial = context.track(
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: seed,
        uniforms: {
          uState: { value: read.texture },
          uPoint: { value: new Vector2(0.5, 0.5) },
          uRadius: { value: 0.02 },
          uClear: { value: 0 },
          uNoiseSeed: { value: 0 },
        },
      })
    );
    const pass = (material: ShaderMaterial) => {
      const uniform = material.uniforms["uState"];
      if (uniform) {
        uniform.value = read.texture;
      }
      quad.material = material;
      renderer.setRenderTarget(write);
      renderer.render(quadScene, quadCamera);
      [read, write] = [write, read];
    };
    const withTarget = (body: () => void) => {
      const previous = renderer.getRenderTarget();
      body();
      renderer.setRenderTarget(previous);
    };
    const stateTexture: { value: Texture } = { value: read.texture };
    let seedCount = 0;
    const reset = () => {
      withTarget(() => {
        const clear = seedMaterial.uniforms["uClear"];
        const noise = seedMaterial.uniforms["uNoiseSeed"];
        if (clear && noise) {
          clear.value = 1;
          noise.value = seedCount++;
          pass(seedMaterial);
          clear.value = 0;
        }
      });
    };
    reset();

    // 模様を貼り、B の量だけ表面を盛り上げたドーナツ
    const material = new MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.05,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms["uState"] = stateTexture;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform sampler2D uState;\nvarying float vB;"
        )
        .replace(
          "#include <begin_vertex>",
          `float b = texture2D(uState, uv).g;
          vB = b;
          vec3 transformed = position + normal * smoothstep(0.1, 0.4, b) * 0.06;`
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform sampler2D uState;\nvarying float vB;"
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float bb = smoothstep(0.08, 0.35, texture2D(uState, vUv).g);
          vec3 base = vec3(0.07, 0.1, 0.18);
          vec3 grown = mix(vec3(0.95, 0.42, 0.38), vec3(1.0, 0.82, 0.55), smoothstep(0.3, 0.6, texture2D(uState, vUv).g));
          diffuseColor.rgb = mix(base, grown, bb);`
        );
    };
    material.customProgramCacheKey = () => "reaction-diffusion-torus";
    // vUv を使うため、map がなくても UV を有効にする
    material.defines = { USE_UV: "" };
    const torus = new Mesh(new TorusGeometry(1.2, 0.45, 192, 512), material);
    torus.position.y = 0.9;
    torus.rotation.x = -Math.PI / 2.6;
    torus.castShadow = true;
    scene.add(torus);

    const raycaster = new Raycaster();
    let presetUsed = "";
    let wasDown = false;
    return {
      action(key) {
        if (key === "reset") {
          reset();
        }
      },
      update({ dt }) {
        const preset = String(params["preset"]);
        if (preset !== presetUsed) {
          presetUsed = preset;
          const values = PRESETS[preset];
          if (values) {
            context.setParam("feed", values.feed);
            context.setParam("kill", values.kill);
          }
        }
        // クリック：ドーナツの表面の UV を調べて種をまく
        if (pointer.down && !wasDown && pointer.inside) {
          raycaster.setFromCamera(pointer.ndc, camera);
          const [hit] = raycaster.intersectObject(torus);
          const point = seedMaterial.uniforms["uPoint"];
          if (hit?.uv && point) {
            point.value = hit.uv.clone();
            withTarget(() => pass(seedMaterial));
          }
        }
        wasDown = pointer.down;
        if (dt > 0) {
          const feed = simMaterial.uniforms["uFeed"];
          const kill = simMaterial.uniforms["uKill"];
          if (feed && kill) {
            feed.value = Number(params["feed"]);
            kill.value = Number(params["kill"]);
          }
          const iterations = Number(params["speed"]);
          withTarget(() => {
            for (let i = 0; i < iterations; i++) {
              pass(simMaterial);
            }
          });
        }
        stateTexture.value = read.texture;
        context.readout("格子", `${TEX_W}×${TEX_H}（端がつながる）`);
        context.caption(
          "各マスで、A は周りへ速く広がり、B はゆっくり広がる。B は A を食べて増えるが、B が増えた所の周りは A が食べ尽くされて B が育たない。「近くでは増え、少し離れると抑えられる」ので、一定の間隔の模様が自然に生まれる。f と k を少し変えるだけで、斑点・しま・迷路と模様ががらりと変わる。"
        );
      },
    };
  },
};
