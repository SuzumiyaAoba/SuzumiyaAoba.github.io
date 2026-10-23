import { MeshPhysicalMaterial } from "three";
import type { Texture } from "three";

const grainShader = `
varying vec3 vIe600Position;
varying vec3 vIe600Normal;
uniform sampler2D ie600Grain;
uniform sampler2D ie600FrontMarks;
uniform sampler2D ie600RearMarks;
uniform float ie600HasMarks;

vec3 ie600SurfaceGrain(vec3 point) {
  vec3 weights = pow(abs(normalize(vIe600Normal)), vec3(4.0));
  weights /= weights.x + weights.y + weights.z;
  vec3 coordinate = point / 6.0;
  return texture2D(ie600Grain, coordinate.yz).rgb * weights.x
    + texture2D(ie600Grain, coordinate.xz).rgb * weights.y
    + texture2D(ie600Grain, coordinate.xy).rgb * weights.z;
}

float ie600Engraving(vec3 point) {
  vec2 uv = (point.xy + vec2(14.0, 12.0)) / 28.0;
  float front = smoothstep(0.05, 0.35, normalize(vIe600Normal).z);
  float rear = smoothstep(0.05, 0.35, -normalize(vIe600Normal).z);
  return ie600HasMarks * (texture2D(ie600FrontMarks, uv).r * front
    + texture2D(ie600RearMarks, uv).r * rear);
}

float ie600SurfaceHeight(vec3 point) {
  return ie600SurfaceGrain(point).r * 0.075 - ie600Engraving(point) * 0.035;
}

vec3 ie600PerturbNormal(vec3 surfaceNormal, float facing) {
  vec3 dx = dFdx(-vViewPosition);
  vec3 dy = dFdy(-vViewPosition);
  vec3 r1 = cross(dy, surfaceNormal);
  vec3 r2 = cross(surfaceNormal, dx);
  float determinant = dot(dx, r1) * facing;
  float height = ie600SurfaceHeight(vIe600Position);
  vec3 gradient = sign(determinant) * (dFdx(height) * r1 + dFdy(height) * r2);
  return normalize(max(abs(determinant), 0.0000001) * surfaceNormal - gradient);
}

`;

/** 三方向から同じ粒度を投影し、側面で金属模様が筋状に伸びるのを防ぐ。 */
export function ie600ZirconiumMaterial(
  grain: Texture,
  frontMarks: Texture,
  rearMarks: Texture,
  marks: boolean
) {
  const material = new MeshPhysicalMaterial({
    color: 0xa4_a6_a5,
    metalness: 0.9,
    roughness: 0.66,
    bumpMap: grain,
    bumpScale: 1,
    roughnessMap: grain,
    envMapIntensity: 1,
  });
  material.customProgramCacheKey = () => "ie600-zirconium-grain-engraving-v2";
  material.onBeforeCompile = (shader) => {
    shader.uniforms["ie600Grain"] = { value: grain };
    shader.uniforms["ie600FrontMarks"] = { value: frontMarks };
    shader.uniforms["ie600RearMarks"] = { value: rearMarks };
    shader.uniforms["ie600HasMarks"] = { value: marks ? 1 : 0 };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vIe600Position;\nvarying vec3 vIe600Normal;"
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvIe600Position = position;\nvIe600Normal = normal;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${grainShader}`)
      .replace(
        "#include <roughnessmap_fragment>",
        "float roughnessFactor = roughness * ie600SurfaceGrain(vIe600Position).g;"
      )
      .replace(
        "#include <normal_fragment_maps>",
        "normal = ie600PerturbNormal(normal, faceDirection);"
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.rgb *= (0.8 + 0.25 * ie600SurfaceGrain(vIe600Position).b) * (1.0 - 0.7 * ie600Engraving(vIe600Position));"
      );
  };
  return material;
}
