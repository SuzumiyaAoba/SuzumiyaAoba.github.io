import { Vector3 } from "three";
import type { Material, MeshStandardMaterial } from "three";

const surfaceMaterials = new WeakSet<Material>();

export function hasSurfaceFinish(
  material: Material
): material is MeshStandardMaterial {
  return surfaceMaterials.has(material);
}

type SurfaceFinish = {
  scale?: readonly [number, number, number];
  relief?: number;
  roughness?: number;
};

/** mm 単位の微細加工。UV のない側壁や面取りにも同じ粒度を保つ。 */
export function applySurfaceFinish<T extends MeshStandardMaterial>(
  material: T,
  { scale = [8, 8, 8], relief = 0.012, roughness = 0.08 }: SurfaceFinish = {}
): T {
  surfaceMaterials.add(material);
  material.customProgramCacheKey = () => "audio-physical-surface-v2";
  material.onBeforeCompile = (shader) => {
    shader.uniforms["audioSurfaceScale"] = { value: new Vector3(...scale) };
    shader.uniforms["audioSurfaceRelief"] = { value: relief };
    shader.uniforms["audioSurfaceRoughness"] = { value: roughness };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 audioSurfacePosition;
attribute vec3 audioOriginalPosition;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
audioSurfacePosition = (instanceMatrix * vec4(audioOriginalPosition, 1.0)).xyz;
#else
audioSurfacePosition = audioOriginalPosition;
#endif`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 audioSurfacePosition;
uniform vec3 audioSurfaceScale;
uniform float audioSurfaceRelief;
uniform float audioSurfaceRoughness;
float audioSurfaceHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float audioSurfaceNoise(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(audioSurfaceHash(cell), audioSurfaceHash(cell + vec3(1,0,0)), f.x),
        mix(audioSurfaceHash(cell + vec3(0,1,0)), audioSurfaceHash(cell + vec3(1,1,0)), f.x), f.y),
    mix(mix(audioSurfaceHash(cell + vec3(0,0,1)), audioSurfaceHash(cell + vec3(1,0,1)), f.x),
        mix(audioSurfaceHash(cell + vec3(0,1,1)), audioSurfaceHash(cell + vec3(1,1,1)), f.x), f.y), f.z);
}`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
vec3 audioGrainPoint = audioSurfacePosition * audioSurfaceScale;
// Subpixel grain fades into the mean roughness instead of sparkling on rotation.
float audioGrainCoverage = 1.0 / (1.0 + dot(fwidth(audioGrainPoint), fwidth(audioGrainPoint)));
float audioGrain = (audioSurfaceNoise(audioGrainPoint) - 0.5) * audioGrainCoverage;
roughnessFactor = clamp(roughnessFactor + audioGrain * audioSurfaceRoughness, 0.04, 1.0);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
vec3 audioSurfaceDx = dFdx(-vViewPosition);
vec3 audioSurfaceDy = dFdy(-vViewPosition);
vec3 audioSurfaceR1 = cross(audioSurfaceDy, normal);
vec3 audioSurfaceR2 = cross(normal, audioSurfaceDx);
float audioSurfaceDet = dot(audioSurfaceDx, audioSurfaceR1) * faceDirection;
float audioSurfaceHeight = audioGrain * audioSurfaceRelief;
vec3 audioSurfaceGradient = sign(audioSurfaceDet) *
  (dFdx(audioSurfaceHeight) * audioSurfaceR1 + dFdy(audioSurfaceHeight) * audioSurfaceR2);
normal = normalize(max(abs(audioSurfaceDet), 0.0000001) * normal - audioSurfaceGradient);`
      );
  };
  return material;
}
