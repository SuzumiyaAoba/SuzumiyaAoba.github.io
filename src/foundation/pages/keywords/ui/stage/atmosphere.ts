import {
  Color,
  Matrix4,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import type { DemoContext } from "./types";

/** 地球の大気の値（単位 km）。 */
const PLANET_RADIUS = 6360;
const ATMOSPHERE_RADIUS = 6420;
const RAYLEIGH_HEIGHT = 8;
const MIE_HEIGHT = 1.2;
/** 波長 680 / 550 / 440 nm のレイリー散乱係数（1/km）。 */
export const RAYLEIGH = new Vector3(5.8e-3, 13.5e-3, 33.1e-3);
export const MIE = 21e-3;

/**
 * 大気の単一散乱を画面全体に描く（Nishita 型の数値積分）。
 * uniforms: uSun（太陽の向き）, uRayleighScale, uMieScale, uG, uSpace（宇宙から見るか）
 */
export function atmosphereSky(context: DemoContext) {
  const uniforms = {
    uSun: { value: new Vector3(0, 0.1, -1).normalize() },
    uRayleighScale: { value: 1 },
    uMieScale: { value: 1 },
    uG: { value: 0.76 },
    uSpace: { value: 0 },
    uExposure: { value: 1 },
    uFlat: { value: 0 },
    uCameraWorld: { value: new Matrix4() },
    uProjectionInverse: { value: new Matrix4() },
  };
  const material = new ShaderMaterial({
    uniforms,
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      varying vec2 vNdc;
      void main() {
        vNdc = position.xy;
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun;
      uniform float uRayleighScale;
      uniform float uMieScale;
      uniform float uG;
      uniform float uSpace;
      uniform float uExposure;
      uniform float uFlat;
      uniform mat4 uCameraWorld;
      uniform mat4 uProjectionInverse;
      varying vec2 vNdc;
      const float RP = ${PLANET_RADIUS.toFixed(1)};
      const float RA = ${ATMOSPHERE_RADIUS.toFixed(1)};
      const float HR = ${RAYLEIGH_HEIGHT.toFixed(1)};
      const float HM = ${MIE_HEIGHT.toFixed(1)};
      const vec3 BETA_R = vec3(${RAYLEIGH.x}, ${RAYLEIGH.y}, ${RAYLEIGH.z});
      const float BETA_M = ${MIE};
      const float PI = 3.14159265;
      vec2 sphere(vec3 ro, vec3 rd, float r) {
        float b = dot(ro, rd);
        float c = dot(ro, ro) - r * r;
        float h = b * b - c;
        if (h < 0.0) return vec2(1e9, -1e9);
        h = sqrt(h);
        return vec2(-b - h, -b + h);
      }
      void main() {
        vec4 view = uProjectionInverse * vec4(vNdc, 1.0, 1.0);
        vec3 rd = normalize((uCameraWorld * vec4(view.xyz / view.w, 0.0)).xyz);
        vec3 ro = uSpace > 0.5 ? vec3(0.0, 0.0, RP * 3.2) : vec3(0.0, RP + 0.2, 0.0);
        // uFlat = 1 のとき、波長による違いをなくす（全色を同じだけ散乱）
        vec3 betaR = mix(BETA_R, vec3(dot(BETA_R, vec3(1.0 / 3.0))), uFlat) * uRayleighScale;
        float betaM = BETA_M * uMieScale;
        vec2 atmosphere = sphere(ro, rd, RA);
        vec2 ground = sphere(ro, rd, RP);
        float tStart = max(atmosphere.x, 0.0);
        float tEnd = atmosphere.y;
        bool hitGround = ground.x > 0.0;
        if (hitGround) tEnd = min(tEnd, ground.x);
        vec3 color = vec3(0.0);
        float opticalR = 0.0;
        float opticalM = 0.0;
        if (tEnd > tStart) {
          const int STEPS = 24;
          const int LIGHT_STEPS = 8;
          float stepSize = (tEnd - tStart) / float(STEPS);
          vec3 sumR = vec3(0.0);
          vec3 sumM = vec3(0.0);
          for (int i = 0; i < STEPS; i++) {
            vec3 p = ro + rd * (tStart + stepSize * (float(i) + 0.5));
            float height = length(p) - RP;
            float hr = exp(-height / HR) * stepSize;
            float hm = exp(-height / HM) * stepSize;
            opticalR += hr;
            opticalM += hm;
            // 太陽から p までの大気の厚み
            vec2 toSun = sphere(p, uSun, RA);
            if (sphere(p, uSun, RP).x > 0.0) continue;
            float lightStep = toSun.y / float(LIGHT_STEPS);
            float lightR = 0.0;
            float lightM = 0.0;
            for (int j = 0; j < LIGHT_STEPS; j++) {
              vec3 q = p + uSun * (lightStep * (float(j) + 0.5));
              float h = length(q) - RP;
              lightR += exp(-h / HR) * lightStep;
              lightM += exp(-h / HM) * lightStep;
            }
            vec3 tau = betaR * (opticalR + lightR) + betaM * 1.1 * (opticalM + lightM);
            vec3 attenuation = exp(-tau);
            sumR += attenuation * hr;
            sumM += attenuation * hm;
          }
          float mu = dot(rd, uSun);
          float phaseR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
          float g = uG;
          float phaseM = 3.0 / (8.0 * PI) * ((1.0 - g * g) * (1.0 + mu * mu)) / ((2.0 + g * g) * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
          color = 20.0 * (sumR * betaR * phaseR + sumM * betaM * phaseM);
          if (hitGround) {
            // 地面（海と陸）：太陽の当たり具合と、手前の大気による減衰
            vec3 hit = ro + rd * ground.x;
            vec3 n = normalize(hit);
            float sunlit = max(dot(n, uSun), 0.0);
            vec3 extinction = exp(-(betaR * opticalR + betaM * 1.1 * opticalM));
            vec3 surface = vec3(0.03, 0.06, 0.1) * sunlit * 3.0;
            color += surface * extinction;
          }
        }
        // 太陽の円盤
        if (!hitGround) {
          float sunDisc = smoothstep(0.9997, 0.99985, dot(rd, uSun));
          vec3 sunTransmit = exp(-(betaR * opticalR + betaM * 1.1 * opticalM));
          color += sunDisc * 40.0 * sunTransmit;
        }
        gl_FragColor = vec4(color * uExposure, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    uniforms.uCameraWorld.value.copy(camera.matrixWorld);
    uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
  };
  context.scene.add(mesh);
  return Object.assign(mesh, { uniforms });
}

/** 地上に届く太陽光の色（大気を通り抜けた後の透過率）。 */
export function sunlightColor(
  sun: Vector3,
  rayleighScale: number,
  mieScale: number,
  out = new Color(),
  flat = false
) {
  const origin = new Vector3(0, PLANET_RADIUS + 0.2, 0);
  const b = origin.dot(sun);
  const c = origin.lengthSq() - ATMOSPHERE_RADIUS * ATMOSPHERE_RADIUS;
  const length = -b + Math.sqrt(Math.max(b * b - c, 0));
  const steps = 16;
  let opticalR = 0;
  let opticalM = 0;
  const point = new Vector3();
  for (let index = 0; index < steps; index++) {
    point.copy(origin).addScaledVector(sun, (length * (index + 0.5)) / steps);
    const height = point.length() - PLANET_RADIUS;
    if (height < 0) {
      return out.setRGB(0, 0, 0);
    }
    opticalR += Math.exp(-height / RAYLEIGH_HEIGHT) * (length / steps);
    opticalM += Math.exp(-height / MIE_HEIGHT) * (length / steps);
  }
  const average = (RAYLEIGH.x + RAYLEIGH.y + RAYLEIGH.z) / 3;
  const tau = (beta: number) =>
    (flat ? average : beta) * rayleighScale * opticalR +
    MIE * mieScale * 1.1 * opticalM;
  return out.setRGB(
    Math.exp(-tau(RAYLEIGH.x)),
    Math.exp(-tau(RAYLEIGH.y)),
    Math.exp(-tau(RAYLEIGH.z))
  );
}
