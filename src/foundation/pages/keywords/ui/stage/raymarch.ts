import {
  DoubleSide,
  Matrix4,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import type { IUniform } from "three";
import { declareUniforms } from "./surface";
import type { SurfaceUniforms } from "./surface";
import type { DemoContext } from "./types";

/** ステージの照明（runtime.ts）に合わせた、距離場用のライティング。 */
const lighting = /* glsl */ `
vec3 toLinear(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }
const vec3 KEY_DIR = vec3(0.4417, 0.7951, 0.3534);
const vec3 RIM_DIR = vec3(-0.5970, 0.3980, -0.6965);
const vec3 SKY = vec3(0.51, 0.66, 1.0);
const vec3 GROUND = vec3(0.010, 0.013, 0.022);

float softShadow(vec3 ro, vec3 rd) {
  float result = 1.0;
  float t = 0.02;
  for (int i = 0; i < 40; i++) {
    float h = sceneDistance(ro + rd * t);
    result = min(result, 10.0 * h / t);
    t += clamp(h, 0.02, 0.4);
    if (result < 0.004 || t > 12.0) break;
  }
  return clamp(result, 0.0, 1.0);
}

float ambientOcclusion(vec3 p, vec3 n) {
  float occlusion = 0.0;
  float weight = 1.0;
  for (int i = 1; i <= 5; i++) {
    float h = SHADOW_OFFSET + 0.02 + 0.09 * float(i);
    occlusion += (h - sceneDistance(p + n * h)) * weight;
    weight *= 0.7;
  }
  return clamp(1.0 - 2.2 * occlusion, 0.0, 1.0);
}

float ggx(float nh, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float d = nh * nh * (a2 - 1.0) + 1.0;
  return a2 / (3.14159265 * d * d);
}

vec3 shade(vec3 p, vec3 n, vec3 rd, vec3 albedo, float roughness, float metalness) {
  vec3 base = toLinear(albedo);
  vec3 v = -rd;
  float ao = ambientOcclusion(p, n);
  float shadow = softShadow(p + n * SHADOW_OFFSET, KEY_DIR);
  float nl = max(dot(n, KEY_DIR), 0.0);
  vec3 h = normalize(KEY_DIR + v);
  float nh = max(dot(n, h), 0.0);
  float nv = max(dot(n, v), 1e-3);
  vec3 f0 = mix(vec3(0.04), base, metalness);
  vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - max(dot(h, v), 0.0), 5.0);
  vec3 diffuseColor = base * (1.0 - metalness);
  vec3 key = vec3(1.0, 0.91, 0.79) * 1.6;
  vec3 color = key * nl * shadow * (diffuseColor / 3.14159265 + fresnel * ggx(nh, max(roughness, 0.05)) * 0.25);
  vec3 hemisphere = mix(GROUND, SKY, 0.5 + 0.5 * n.y) * 0.55;
  color += hemisphere * diffuseColor / 3.14159265 * ao;
  color += vec3(0.1, 0.4, 1.0) * 0.9 * max(dot(n, RIM_DIR), 0.0) * diffuseColor / 3.14159265;
  // 周囲の映り込み（簡易）
  vec3 r = reflect(rd, n);
  vec3 envFresnel = f0 + (1.0 - f0) * pow(1.0 - nv, 5.0);
  vec3 environment = mix(vec3(0.02, 0.025, 0.035), vec3(0.34, 0.4, 0.52), smoothstep(-0.2, 0.6, r.y));
  color += environment * envFresnel * (1.0 - roughness * 0.85) * ao * mix(0.5, 1.0, metalness);
  return color;
}
`;

/**
 * 画面全体をレイマーチングして距離場を描く。
 * functions には次を定義する。
 *   float map(vec3 p)                    … 物体までの距離（床は含めない）
 *   vec4 surface(vec3 p, vec3 n)         … rgb = 色（sRGB）, a = 粗さ
 * options.metalness が true なら float surfaceMetalness(vec3 p) も、
 * options.emission が true なら vec3 emission(vec3 p, vec3 n)（sRGB）も定義する。
 * 深度を書き込むので、通常の three.js の物体と正しく前後関係が付く。
 */
export function raymarchWorld(
  context: DemoContext,
  options: {
    functions: string;
    uniforms?: SurfaceUniforms;
    /** 宣言を functions 側に書く uniform（配列など）。 */
    rawUniforms?: Record<string, IUniform>;
    steps?: number;
    maxDistance?: number;
    /** 床の高さ。null なら床を描かない。 */
    floor?: number | null;
    /** 1 未満にすると歩幅を縮めて、厳密でない距離場でも踏み越えにくくする（uniforms.uStepScale で後から変更可）。 */
    stepScale?: number;
    emission?: boolean;
    metalness?: boolean;
    /** 影と遮蔽を調べ始める表面からの距離（厳密でない距離場では大きめにする）。 */
    shadowOffset?: number;
    /** true なら vec3 customNormal(vec3 p) を定義し、物体の法線に使う。 */
    customNormal?: boolean;
    /** uStepView が 1 のとき、反復回数を色で表示する。 */
    stepView?: boolean;
  }
) {
  const steps = options.steps ?? 128;
  const floor = options.floor === undefined ? 0 : options.floor;
  const uniforms: SurfaceUniforms = {
    uTime: { value: 0 },
    uStepView: { value: 0 },
    uStepScale: { value: options.stepScale ?? 1 },
    ...options.uniforms,
  };
  const matrices = {
    uCameraWorld: { value: new Matrix4() },
    uProjection: { value: new Matrix4() },
    uProjectionInverse: { value: new Matrix4() },
  };
  const defines = [
    floor === null ? "" : `#define FLOOR_Y ${floor.toFixed(3)}`,
    options.emission ? "#define HAS_EMISSION" : "",
    options.metalness ? "#define HAS_METALNESS" : "",
    options.stepView ? "#define STEP_VIEW" : "",
    options.customNormal ? "#define CUSTOM_NORMAL" : "",
    `#define MAX_STEPS ${steps}`,
    `#define MAX_DISTANCE ${(options.maxDistance ?? 40).toFixed(1)}`,
    `#define SHADOW_OFFSET ${(options.shadowOffset ?? 0.01).toFixed(3)}`,
  ].join("\n");
  const material = new ShaderMaterial({
    uniforms: { ...uniforms, ...options.rawUniforms, ...matrices },
    depthWrite: true,
    depthTest: true,
    vertexShader: /* glsl */ `
      varying vec2 vNdc;
      void main() {
        vNdc = position.xy;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${defines}
      ${declareUniforms(uniforms)}
      uniform mat4 uCameraWorld;
      uniform mat4 uProjection;
      uniform mat4 uProjectionInverse;
      varying vec2 vNdc;
      ${options.functions}
      float sceneDistance(vec3 p) {
        float d = map(p);
        #ifdef FLOOR_Y
        d = min(d, p.y - FLOOR_Y);
        #endif
        return d;
      }
      ${lighting}
      vec3 sceneNormal(vec3 p) {
        const vec2 k = vec2(1.0, -1.0);
        const float e = 0.0012;
        return normalize(
          k.xyy * sceneDistance(p + k.xyy * e) +
          k.yyx * sceneDistance(p + k.yyx * e) +
          k.yxy * sceneDistance(p + k.yxy * e) +
          k.xxx * sceneDistance(p + k.xxx * e));
      }
      float floorGrid(vec2 p, float scale, float width) {
        vec2 coord = p / scale;
        vec2 g = abs(fract(coord - 0.5) - 0.5) / max(width / scale, 1e-4);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      vec3 stepColor(float x) {
        vec3 c0 = vec3(0.03, 0.04, 0.1);
        vec3 c1 = vec3(0.36, 0.12, 0.55);
        vec3 c2 = vec3(0.93, 0.36, 0.25);
        vec3 c3 = vec3(1.0, 0.93, 0.6);
        if (x < 0.33) return mix(c0, c1, x / 0.33);
        if (x < 0.66) return mix(c1, c2, (x - 0.33) / 0.33);
        return mix(c2, c3, clamp((x - 0.66) / 0.34, 0.0, 1.0));
      }
      void main() {
        vec4 view = uProjectionInverse * vec4(vNdc, 1.0, 1.0);
        vec3 rd = normalize((uCameraWorld * vec4(view.xyz / view.w, 0.0)).xyz);
        vec3 ro = cameraPosition;
        float t = 0.0;
        bool hit = false;
        int used = MAX_STEPS;
        for (int i = 0; i < MAX_STEPS; i++) {
          float d = sceneDistance(ro + rd * t);
          if (d < 0.0004 * t + 0.0004) {
            hit = true;
            used = i;
            break;
          }
          t += d * uStepScale;
          if (t > MAX_DISTANCE) {
            used = i;
            break;
          }
        }
        #ifdef STEP_VIEW
        if (uStepView > 0.5) {
          float x = float(used) / float(MAX_STEPS);
          gl_FragColor = vec4(toLinear(stepColor(pow(x, 0.7))), 1.0);
          vec3 q = ro + rd * min(t, MAX_DISTANCE);
          vec4 stepClip = uProjection * viewMatrix * vec4(q, 1.0);
          gl_FragDepth = hit ? clamp(stepClip.z / stepClip.w * 0.5 + 0.5, 0.0, 1.0) : 0.99999;
          #include <colorspace_fragment>
          return;
        }
        #endif
        if (!hit) discard;
        vec3 p = ro + rd * t;
        vec3 n = sceneNormal(p);
        vec3 color;
        bool onFloor = false;
        #ifdef FLOOR_Y
        onFloor = p.y - FLOOR_Y <= map(p);
        #endif
        if (onFloor) {
          float width = t * 0.0022;
          float minor = floorGrid(p.xz, 0.5, width) * 0.12;
          float major = floorGrid(p.xz, 2.0, width) * 0.28;
          vec3 albedo = mix(vec3(0.055, 0.07, 0.095), vec3(0.52, 0.58, 0.67), max(minor, major));
          color = shade(p, n, rd, albedo, 0.9, 0.0);
        } else {
          #ifdef CUSTOM_NORMAL
          n = customNormal(p);
          #endif
          vec4 s = surface(p, n);
          float metal = 0.0;
          #ifdef HAS_METALNESS
          metal = surfaceMetalness(p);
          #endif
          color = shade(p, n, rd, s.rgb, s.a, metal);
          #ifdef HAS_EMISSION
          color += toLinear(emission(p, n));
          #endif
        }
        float fog = smoothstep(14.0, 34.0, t);
        color = mix(color, toLinear(vec3(0.039, 0.059, 0.09)), fog);
        vec4 clip = uProjection * viewMatrix * vec4(p, 1.0);
        gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -20;
  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    matrices.uCameraWorld.value.copy(camera.matrixWorld);
    matrices.uProjection.value.copy(camera.projectionMatrix);
    matrices.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
  };
  context.scene.add(mesh);
  return Object.assign(mesh, { uniforms });
}

/** 距離場でよく使う GLSL 関数（Inigo Quilez の定義に基づく）。 */
export const glslSdf = /* glsl */ `
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdRoundBox(vec3 p, vec3 b, float r) { return sdBox(p, b - r) - r; }
float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}
float sdCappedCylinder(vec3 p, float h, float r) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / max(k, 1e-5);
  return min(a, b) - h * h * k * 0.25;
}
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
mat2 rot2(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }
`;

/**
 * 距離場の断面を等距離線で描く板（z = 一定の縦の面）。
 * functions には float sectionDistance(vec3 p) を定義する。
 */
export function distanceSection(options: {
  functions: string;
  uniforms?: SurfaceUniforms;
  rawUniforms?: Record<string, IUniform>;
  width: number;
  height: number;
  /** 等距離線の間隔。 */
  spacing?: number;
}) {
  const uniforms: SurfaceUniforms = {
    uTime: { value: 0 },
    ...options.uniforms,
  };
  const halfWidth = (options.width / 2).toFixed(2);
  const halfHeight = (options.height / 2).toFixed(2);
  const material = new ShaderMaterial({
    uniforms: { ...uniforms, ...options.rawUniforms },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec2 vLocal;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vLocal = position.xy;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      ${declareUniforms(uniforms)}
      varying vec3 vWorld;
      varying vec2 vLocal;
      ${options.functions}
      void main() {
        float d = sectionDistance(vWorld);
        float bands = 0.5 + 0.5 * cos(6.2831853 * d / ${(options.spacing ?? 0.2).toFixed(3)});
        vec3 color = d > 0.0 ? vec3(0.95, 0.62, 0.28) : vec3(0.45, 0.72, 1.0);
        float w = fwidth(d);
        float line = 1.0 - smoothstep(0.0, 1.5 * w, abs(d));
        float alpha = d > 0.0 ? 0.14 + 0.16 * bands : 0.85;
        alpha = max(alpha, line);
        vec2 edge = abs(vLocal) - vec2(${halfWidth}, ${halfHeight});
        alpha *= 1.0 - smoothstep(-0.45, 0.0, max(edge.x, edge.y));
        vec3 shade = mix(color * (d > 0.0 ? 0.7 : 0.6), vec3(1.0), line);
        gl_FragColor = vec4(pow(shade, vec3(2.2)), alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(
    new PlaneGeometry(options.width, options.height),
    material
  );
  return Object.assign(mesh, { uniforms });
}
