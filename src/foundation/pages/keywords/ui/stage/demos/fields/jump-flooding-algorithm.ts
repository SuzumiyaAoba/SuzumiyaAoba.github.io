import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  FloatType,
  Group,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from "three";
import { rng, standard, TAU } from "../../kit";
import type { DemoModule } from "../../types";

const WIDTH = 512;
const HEIGHT = 320;
const PLANE_WIDTH = 7.2;
const PLANE_DEPTH = (PLANE_WIDTH * HEIGHT) / WIDTH;
const SEEDS = 12;
const PASSES = Math.ceil(Math.log2(Math.max(WIDTH, HEIGHT)));

const fullscreenVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const demo: DemoModule = {
  alt: "戦略ゲームの地図で、各都市の勢力圏（最も近い都市）を GPU で求めるジャンプフラッドのデモ。最初は都市の画素だけが自分の位置を知っている。各パスで、半分ずつ縮む歩幅だけ離れた 8 近傍の情報を見て、より近い都市があれば書き換える。9 回のパスで 512×320 画素すべての最寄りの都市と距離が決まる。",
  camera: { position: [0, 6.2, 5.6], target: [0, 0, 0.3] },
  controls: [
    {
      type: "range",
      key: "passes",
      label: "実行したパス数",
      min: 0,
      max: PASSES,
      step: 1,
      value: PASSES,
    },
    { type: "toggle", key: "auto", label: "パスを順に再生", value: true },
    {
      type: "select",
      key: "view",
      label: "表示",
      value: "territory",
      options: [
        { value: "territory", label: "勢力圏（ボロノイ）" },
        { value: "distance", label: "最寄りの都市までの距離" },
      ],
    },
    { type: "toggle", key: "move", label: "都市を動かす", value: false },
  ],
  hint: "都市（塔）をドラッグすると、勢力圏がその場で計算し直されます。",
  setup(context) {
    const { scene, params, renderer } = context;
    const random = rng(21);
    const seeds = Array.from(
      { length: SEEDS },
      () => new Vector2(random() * WIDTH, random() * HEIGHT)
    );
    const drift = seeds.map(() => ({
      phase: random() * TAU,
      speed: 0.3 + random() * 0.4,
    }));
    const origins = seeds.map((seed) => seed.clone());
    const colors = Array.from({ length: SEEDS }, (_, index) =>
      new Color().setHSL(index / SEEDS, 0.55, 0.52)
    );

    const makeTarget = () =>
      context.track(
        new WebGLRenderTarget(WIDTH, HEIGHT, {
          type: FloatType,
          format: RGBAFormat,
          minFilter: NearestFilter,
          magFilter: NearestFilter,
          depthBuffer: false,
        })
      );
    const targets = [makeTarget(), makeTarget()] as const;
    const quadScene = new Scene();
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const seedMaterial = context.track(
      new ShaderMaterial({
        uniforms: { uSeeds: { value: seeds } },
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform vec2 uSeeds[${SEEDS}];
          void main() {
            vec2 px = gl_FragCoord.xy;
            // 種（都市）のある画素だけが、自分の位置と番号を持つ
            gl_FragColor = vec4(-1.0);
            for (int i = 0; i < ${SEEDS}; i++) {
              vec2 s = floor(uSeeds[i]) + 0.5;
              if (all(lessThan(abs(px - s), vec2(0.5)))) gl_FragColor = vec4(s, float(i), 1.0);
            }
          }
        `,
      })
    );
    const jfaUniforms = {
      uPrevious: { value: targets[0].texture },
      uStep: { value: 1 },
      uSize: { value: new Vector2(WIDTH, HEIGHT) },
    };
    const jfaMaterial = context.track(
      new ShaderMaterial({
        uniforms: jfaUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uPrevious;
          uniform float uStep;
          uniform vec2 uSize;
          void main() {
            vec2 px = gl_FragCoord.xy;
            vec4 best = vec4(-1.0);
            float bestDistance = 1e20;
            // 歩幅 uStep だけ離れた 8 近傍と自分を調べ、最も近い種を受け継ぐ
            for (int y = -1; y <= 1; y++) {
              for (int x = -1; x <= 1; x++) {
                vec2 q = px + vec2(float(x), float(y)) * uStep;
                if (any(lessThan(q, vec2(0.0))) || any(greaterThanEqual(q, uSize))) continue;
                vec4 s = texture2D(uPrevious, q / uSize);
                if (s.w < 0.0) continue;
                vec2 d = s.xy - px;
                float distance = dot(d, d);
                if (distance < bestDistance) {
                  bestDistance = distance;
                  best = s;
                }
              }
            }
            gl_FragColor = best;
          }
        `,
      })
    );
    const quad = new Mesh(new PlaneGeometry(2, 2), seedMaterial);
    context.track(quad.geometry);
    quadScene.add(quad);

    const displayUniforms = {
      uResult: { value: targets[0].texture },
      uColors: { value: colors },
      uSize: { value: new Vector2(WIDTH, HEIGHT) },
      uView: { value: 0 },
      uPixel: { value: PLANE_WIDTH / WIDTH },
    };
    const map = new Mesh(
      new PlaneGeometry(PLANE_WIDTH, PLANE_DEPTH),
      new ShaderMaterial({
        uniforms: displayUniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uResult;
          uniform vec3 uColors[${SEEDS}];
          uniform vec2 uSize;
          uniform float uView;
          uniform float uPixel;
          varying vec2 vUv;
          float idAt(vec2 uv) { return texture2D(uResult, uv).z; }
          void main() {
            vec4 s = texture2D(uResult, vUv);
            vec2 px = vUv * uSize;
            if (s.w < 0.0) {
              // まだどの都市の情報も届いていない画素
              float hatch = step(0.5, fract((px.x + px.y) / 12.0));
              gl_FragColor = vec4(vec3(0.05, 0.06, 0.08) + hatch * 0.025, 1.0);
              #include <colorspace_fragment>
              return;
            }
            int id = int(s.z + 0.5);
            vec3 color = uColors[0];
            for (int i = 0; i < ${SEEDS}; i++) {
              if (i == id) color = uColors[i];
            }
            float distance = length(s.xy - px) * uPixel;
            vec2 texel = 1.0 / uSize;
            float border = 0.0;
            border += step(0.5, abs(idAt(vUv + vec2(texel.x, 0.0)) - s.z));
            border += step(0.5, abs(idAt(vUv - vec2(texel.x, 0.0)) - s.z));
            border += step(0.5, abs(idAt(vUv + vec2(0.0, texel.y)) - s.z));
            border += step(0.5, abs(idAt(vUv - vec2(0.0, texel.y)) - s.z));
            vec3 result;
            if (uView < 0.5) {
              float shade = 0.55 + 0.45 * exp(-distance * 0.9);
              result = color * shade;
              result = mix(result, vec3(1.0, 0.96, 0.85), min(border, 1.0) * 0.9);
            } else {
              float bands = 0.5 + 0.5 * cos(6.2831853 * distance / 0.3);
              result = mix(vec3(0.95, 0.72, 0.35), vec3(0.08, 0.12, 0.3), smoothstep(0.0, 2.5, distance));
              result *= 0.75 + 0.25 * bands;
            }
            gl_FragColor = vec4(result, 1.0);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    map.rotation.x = -Math.PI / 2;
    map.position.y = 0.01;
    scene.add(map);

    // 都市（ドラッグできる塔）
    const toWorldX = (px: number) => (px / WIDTH - 0.5) * PLANE_WIDTH;
    const toWorldZ = (py: number) => (0.5 - py / HEIGHT) * PLANE_DEPTH;
    const towers = seeds.map((seed, index) => {
      const group = new Group();
      const color = colors[index] ?? new Color();
      const body = new Mesh(
        new CylinderGeometry(0.08, 0.11, 0.42, 12),
        standard(color.clone().multiplyScalar(1.25), { roughness: 0.4 })
      );
      body.position.y = 0.21;
      const roof = new Mesh(
        new ConeGeometry(0.13, 0.2, 12),
        standard(color.clone().multiplyScalar(0.8), { roughness: 0.5 })
      );
      roof.position.y = 0.52;
      body.castShadow = true;
      roof.castShadow = true;
      group.add(body, roof);
      group.position.set(toWorldX(seed.x), 0, toWorldZ(seed.y));
      scene.add(group);
      context.draggable(group, {
        clamp: (position) =>
          position.set(
            Math.max(
              -PLANE_WIDTH / 2 + 0.05,
              Math.min(PLANE_WIDTH / 2 - 0.05, position.x)
            ),
            0,
            Math.max(
              -PLANE_DEPTH / 2 + 0.05,
              Math.min(PLANE_DEPTH / 2 - 0.05, position.z)
            )
          ),
        onDrag: (position) => {
          seed.set(
            (position.x / PLANE_WIDTH + 0.5) * WIDTH,
            (0.5 - position.z / PLANE_DEPTH) * HEIGHT
          );
          origins[index]?.copy(seed);
        },
      });
      return group;
    });

    let clock = 0;
    let replay = 0;

    const run = (passes: number) => {
      const previous = renderer.getRenderTarget();
      quad.material = seedMaterial;
      renderer.setRenderTarget(targets[0]);
      renderer.render(quadScene, quadCamera);
      let read = 0;
      quad.material = jfaMaterial;
      for (let pass = 0; pass < passes; pass++) {
        const step = 2 ** (PASSES - 1 - pass);
        const source = targets[read];
        const destination = targets[1 - read];
        if (!source || !destination) {
          break;
        }
        jfaUniforms.uPrevious.value = source.texture;
        jfaUniforms.uStep.value = step;
        renderer.setRenderTarget(destination);
        renderer.render(quadScene, quadCamera);
        read = 1 - read;
      }
      renderer.setRenderTarget(previous);
      displayUniforms.uResult.value = (targets[read] ?? targets[0]).texture;
    };

    return {
      change(key) {
        if (key === "passes") {
          context.setParam("auto", false);
        }
      },
      update({ dt }) {
        if (params["move"] === true) {
          clock += dt;
          for (const [index, seed] of seeds.entries()) {
            const origin = origins[index];
            const motion = drift[index];
            if (origin && motion) {
              seed.set(
                origin.x + Math.cos(clock * motion.speed + motion.phase) * 26,
                origin.y +
                  Math.sin(clock * motion.speed * 1.3 + motion.phase) * 18
              );
            }
          }
        }
        for (const [index, tower] of towers.entries()) {
          const seed = seeds[index];
          if (seed) {
            tower.position.set(toWorldX(seed.x), 0, toWorldZ(seed.y));
          }
        }
        let passes = Number(params["passes"]);
        if (params["auto"] === true) {
          replay += dt / 0.8;
          passes = Math.min(PASSES, Math.floor(replay % (PASSES + 4)));
        }
        run(passes);
        displayUniforms.uView.value = params["view"] === "distance" ? 1 : 0;
        const steps = Array.from(
          { length: PASSES },
          (_, index) => 2 ** (PASSES - 1 - index)
        );
        const current = passes > 0 ? steps[passes - 1] : undefined;
        context.readout("パス", `${passes} / ${PASSES}`);
        context.readout(
          "今回の歩幅",
          current === undefined ? "（種を置いただけ）" : `${current} 画素`
        );
        context.readout("画素数", `${WIDTH}×${HEIGHT}`);
        context.caption(
          passes === 0
            ? "最初は都市のある画素だけが自分の位置を知っている。斜線の画素はまだ何も知らない。"
            : passes < PASSES
              ? `歩幅 ${current} 画素離れた 8 近傍を調べ、より近い都市の情報を受け継ぐ。歩幅を半分ずつにしながら繰り返すと、情報が一気に広がる。`
              : "log₂(512) = 9 回のパスで全画素の最寄り都市が決まった。境界線が勢力圏、各画素が持つ都市の位置から距離もすぐに分かる。"
        );
      },
    };
  },
};
