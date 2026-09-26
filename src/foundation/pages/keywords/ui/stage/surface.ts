import {
  BufferAttribute,
  Color,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import type { IUniform, Texture } from "three";

type UniformValue =
  | number
  | Vector2
  | Vector3
  | Vector4
  | Color
  | Texture
  | boolean;

const glslType = (value: UniformValue) => {
  if (typeof value === "number" || typeof value === "boolean") {
    return "float";
  }
  if (value instanceof Vector2) {
    return "vec2";
  }
  if (value instanceof Vector3 || value instanceof Color) {
    return "vec3";
  }
  if (value instanceof Vector4) {
    return "vec4";
  }
  return "sampler2D";
};

export type SurfaceUniforms = Record<string, IUniform<UniformValue>>;

/** uniforms の宣言を GLSL で生成する。 */
export const declareUniforms = (uniforms: SurfaceUniforms) =>
  Object.entries(uniforms)
    .map(([name, uniform]) => `uniform ${glslType(uniform.value)} ${name};`)
    .join("\n");

let surfaceSerial = 0;

/**
 * 高さ関数で頂点を変位させる PBR サーフェス。
 * functions には次の 2 つの GLSL 関数を定義する（色は sRGB で返す）。
 *   float surfaceHeight(vec2 p)            … p はローカルの xz 座標
 *   vec3 surfaceColor(vec2 p, float h, vec3 n)
 * 法線は高さ関数の差分から求めるので、照明と影を正しく受ける。
 */
export function heightSurface(options: {
  width: number;
  depth?: number;
  segments: number;
  functions: string;
  uniforms?: SurfaceUniforms;
  /** 宣言を functions 側に書く uniform（配列など）。 */
  rawUniforms?: Record<string, IUniform>;
  roughness?: number;
  metalness?: number;
  /** 法線を求める差分の幅。 */
  epsilon?: number;
  flatShading?: boolean;
  /** true なら vec3 surfaceEmission(vec2 p, float h) も定義し、発光として加える。 */
  emissive?: boolean;
}) {
  const depth = options.depth ?? options.width;
  const geometry = new PlaneGeometry(
    options.width,
    depth,
    options.segments,
    Math.max(1, Math.round((options.segments * depth) / options.width))
  );
  geometry.rotateX(-Math.PI / 2);
  const uniforms: SurfaceUniforms = {
    uTime: { value: 0 },
    ...options.uniforms,
  };
  const epsilon = (options.epsilon ?? options.width / options.segments / 2)
    .toFixed(5)
    .replace(/0+$/u, "0");
  const header = `${declareUniforms(uniforms)}\nvarying vec3 vSurface;\nvarying vec3 vSurfaceNormal;\n${options.functions}`;
  const material = new MeshStandardMaterial({
    roughness: options.roughness ?? 0.85,
    metalness: options.metalness ?? 0,
    flatShading: options.flatShading ?? false,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, options.rawUniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\n#define SURFACE_VERTEX\n${header}`
      )
      .replace(
        "#include <beginnormal_vertex>",
        `float surfaceEps = ${epsilon};
        float hC = surfaceHeight(position.xz);
        float hX = surfaceHeight(position.xz + vec2(surfaceEps, 0.0));
        float hZ = surfaceHeight(position.xz + vec2(0.0, surfaceEps));
        vec3 objectNormal = normalize(vec3(-(hX - hC) / surfaceEps, 1.0, -(hZ - hC) / surfaceEps));
        vSurfaceNormal = objectNormal;`
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(position.x, position.y + hC, position.z);
        vSurface = vec3(position.x, hC, position.z);`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${header}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 surfaceSrgb = surfaceColor(vSurface.xz, vSurface.y, normalize(vSurfaceNormal));
        diffuseColor.rgb = pow(max(surfaceSrgb, vec3(0.0)), vec3(2.2));`
      )
      .replace(
        "#include <emissivemap_fragment>",
        options.emissive
          ? `#include <emissivemap_fragment>
        totalEmissiveRadiance += pow(max(surfaceEmission(vSurface.xz, vSurface.y), vec3(0.0)), vec3(2.2));`
          : "#include <emissivemap_fragment>"
      );
  };
  surfaceSerial += 1;
  const key = `height-surface-${surfaceSerial}`;
  material.customProgramCacheKey = () => key;
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  return Object.assign(mesh, { uniforms });
}

/**
 * CPU で高さと色を決める格子メッシュ。
 * update(height, color) を呼ぶと頂点と法線を作り直す。
 */
export function gridTerrain(options: {
  width: number;
  depth?: number;
  segments: number;
  roughness?: number;
  flatShading?: boolean;
}) {
  const depth = options.depth ?? options.width;
  const segmentsZ = Math.max(
    1,
    Math.round((options.segments * depth) / options.width)
  );
  const geometry = new PlaneGeometry(
    options.width,
    depth,
    options.segments,
    segmentsZ
  );
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute("position");
  const { count } = position;
  const base = new Float32Array(count * 2);
  for (let index = 0; index < count; index++) {
    base[index * 2] = position.getX(index);
    base[index * 2 + 1] = position.getZ(index);
  }
  const colors = new Float32Array(count * 3);
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: options.roughness ?? 0.9,
    metalness: 0,
    flatShading: options.flatShading ?? false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  const color = new Color();
  const update = (
    height: (x: number, z: number) => number,
    paint: (x: number, z: number, h: number, out: Color) => void
  ) => {
    for (let index = 0; index < count; index++) {
      const x = base[index * 2] ?? 0;
      const z = base[index * 2 + 1] ?? 0;
      const h = height(x, z);
      position.setY(index, h);
      paint(x, z, h, color);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    position.needsUpdate = true;
    const colorAttribute = geometry.getAttribute("color");
    colorAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  };
  return Object.assign(mesh, { update });
}

/**
 * 模様を描く光源の影響を受けない板。
 * fragment には vec3 pattern(vec2 uv) を定義する（uv は 0〜1、色は sRGB）。
 */
export function patternPlane(options: {
  width: number;
  depth?: number;
  functions: string;
  uniforms?: SurfaceUniforms;
  /** true なら xz 平面に寝かせる。 */
  horizontal?: boolean;
}) {
  const uniforms: SurfaceUniforms = {
    uTime: { value: 0 },
    ...options.uniforms,
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      ${declareUniforms(uniforms)}
      ${options.functions}
      void main() {
        gl_FragColor = vec4(pow(max(pattern(vUv), vec3(0.0)), vec3(2.2)), 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: DoubleSide,
  });
  const mesh = new Mesh(
    new PlaneGeometry(options.width, options.depth ?? options.width),
    material
  );
  if (options.horizontal ?? true) {
    mesh.rotation.x = -Math.PI / 2;
  }
  return Object.assign(mesh, { uniforms });
}
