import { MeshPhysicalMaterial } from "three";

/** Sandblasting is evaluated in millimetres by the shader; no texture is loaded. */
export function sigmaAluminiumMaterial() {
  const material = new MeshPhysicalMaterial({
    color: 0x19_1b_1d,
    metalness: 0.45,
    roughness: 0.84,
    envMapIntensity: 0.4,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 sigmaPosition;"
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nsigmaPosition = position;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 sigmaPosition;
float sigmaHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float sigmaNoise(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(sigmaHash(cell), sigmaHash(cell + vec3(1,0,0)), f.x),
        mix(sigmaHash(cell + vec3(0,1,0)), sigmaHash(cell + vec3(1,1,0)), f.x), f.y),
    mix(mix(sigmaHash(cell + vec3(0,0,1)), sigmaHash(cell + vec3(1,0,1)), f.x),
        mix(sigmaHash(cell + vec3(0,1,1)), sigmaHash(cell + vec3(1,1,1)), f.x), f.y), f.z);
}`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
float sigmaGrain = sigmaNoise(sigmaPosition * 7.0);
float sigmaResolved = 1.0 / (1.0 + length(fwidth(sigmaPosition * 7.0)));
roughnessFactor = clamp(roughnessFactor + (sigmaGrain - 0.5) * 0.12 * sigmaResolved, 0.0, 1.0);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
vec3 sigmaDx = dFdx(-vViewPosition);
vec3 sigmaDy = dFdy(-vViewPosition);
vec3 sigmaR1 = cross(sigmaDy, normal);
vec3 sigmaR2 = cross(normal, sigmaDx);
float sigmaDet = dot(sigmaDx, sigmaR1) * faceDirection;
float sigmaHeight = sigmaGrain * 0.022 * sigmaResolved;
vec3 sigmaGradient = sign(sigmaDet) * (dFdx(sigmaHeight) * sigmaR1 + dFdy(sigmaHeight) * sigmaR2);
normal = normalize(abs(sigmaDet) * normal - sigmaGradient);`
      );
  };
  material.customProgramCacheKey = () => "sigma-sandblasted-aluminium-v1";
  return material;
}
