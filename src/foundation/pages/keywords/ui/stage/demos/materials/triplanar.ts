import {
  BoxGeometry,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import { glslHash } from "../../glsl";
import { palette, valueNoise3 } from "../../kit";
import type { DemoModule } from "../../types";

const pattern = /* glsl */ `
  ${glslHash}
  // 石積みの模様（目地つきのレンガ）
  vec3 stones(vec2 p) {
    p *= 2.2;
    float row = floor(p.y);
    p.x += mod(row, 2.0) * 0.5;
    vec2 cell = floor(p);
    vec2 f = fract(p);
    float mortar = min(min(f.x, 1.0 - f.x) * 2.0, min(f.y, 1.0 - f.y) * 4.0);
    float tone = hash12(cell);
    vec3 stone = mix(vec3(0.46, 0.42, 0.37), vec3(0.66, 0.6, 0.5), tone);
    stone *= 0.85 + 0.15 * hash12(floor(p * 9.0));
    return mix(vec3(0.15, 0.13, 0.12), stone, smoothstep(0.02, 0.09, mortar));
  }
`;

function triplanarMaterial(
  uniforms: Record<string, { value: number }>,
  key: string
) {
  const material = new MeshStandardMaterial({
    roughness: 0.85,
    flatShading: false,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vObjPos;
        varying vec3 vObjNormal;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        varying vec2 vUvCoord;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vObjPos = position;
        vObjNormal = normal;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vUvCoord = uv;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uMode;
        uniform float uSharpness;
        uniform float uDebug;
        uniform float uScale;
        varying vec3 vObjPos;
        varying vec3 vObjNormal;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        varying vec2 vUvCoord;
        ${pattern}`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 texel;
        if (uMode < 0.5) {
          texel = stones(vUvCoord * vec2(uScale * 2.0, uScale));
        } else {
          vec3 pos = uMode < 1.5 ? vObjPos : vWorldPos;
          vec3 nrm = normalize(uMode < 1.5 ? vObjNormal : vWorldNormal);
          vec3 w = pow(abs(nrm), vec3(uSharpness));
          w /= (w.x + w.y + w.z);
          if (uDebug > 0.5) {
            texel = w;
          } else {
            vec3 x = stones(pos.zy * uScale * 0.5);
            vec3 y = stones(pos.xz * uScale * 0.5);
            vec3 z = stones(pos.xy * uScale * 0.5);
            texel = x * w.x + y * w.y + z * w.z;
          }
        }
        diffuseColor.rgb = pow(texel, vec3(2.2));`
      );
  };
  material.customProgramCacheKey = () => `triplanar-${key}`;
  return material;
}

export const demo: DemoModule = {
  alt: "回転する岩と背の高い石柱に、石積みの模様を貼るデモ。UV で貼ると岩では模様が極に集まって歪み、柱では縦に引き伸ばされる。トライプラナーでは x・y・z の 3 方向から投影した模様を面の向きで混ぜるため、どんな形でも模様の大きさがそろう。",
  camera: { position: [0.3, 2.6, 7], target: [0, 1.4, 0] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "模様の貼り方",
      value: "triplanar",
      options: [
        { value: "uv", label: "UV" },
        { value: "triplanar", label: "トライプラナー（物体）" },
        { value: "world", label: "トライプラナー（ワールド）" },
      ],
      hint: "ワールド基準では、物体が回転すると模様が表面を滑ります。地形や建物の壁に向きます。",
    },
    {
      type: "range",
      key: "sharpness",
      label: "混ぜ方の鋭さ",
      min: 1,
      max: 16,
      step: 0.5,
      value: 6,
      hint: "小さいと 3 方向の模様が広く混ざってぼやけ、大きいと境目がくっきりします。",
    },
    {
      type: "toggle",
      key: "debug",
      label: "3 方向の重みを色で表示",
      value: false,
    },
  ],
  legend: [
    { color: palette.coral, label: "x 方向からの投影（表示時）" },
    { color: palette.lime, label: "y 方向からの投影（表示時）" },
    { color: palette.sky, label: "z 方向からの投影（表示時）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uMode: { value: 1 },
      uSharpness: { value: 6 },
      uDebug: { value: 0 },
      uScale: { value: 2 },
    };
    const rockGeometry = new IcosahedronGeometry(1.1, 12);
    const position = rockGeometry.getAttribute("position");
    const vertex = new Vector3();
    for (let index = 0; index < position.count; index++) {
      vertex.fromBufferAttribute(position, index);
      const direction = vertex.clone().normalize();
      const bump =
        1 +
        (valueNoise3(direction.x * 1.8, direction.y * 1.8, direction.z * 1.8) -
          0.5) *
          0.55 +
        (valueNoise3(direction.x * 5 + 9, direction.y * 5, direction.z * 5) -
          0.5) *
          0.18;
      vertex.copy(direction).multiplyScalar(1.1 * bump);
      vertex.y *= 0.8;
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
    rockGeometry.computeVertexNormals();
    const rock = new Mesh(rockGeometry, triplanarMaterial(uniforms, "rock"));
    rock.position.set(-1.5, 1.2, 0);
    rock.castShadow = true;
    const pillar = new Mesh(
      new BoxGeometry(0.9, 3.2, 0.9),
      triplanarMaterial(uniforms, "pillar")
    );
    pillar.position.set(1.7, 1.6, -0.2);
    pillar.castShadow = true;
    scene.add(rock, pillar);

    return {
      update({ dt }) {
        const mode = String(params["mode"]);
        uniforms.uMode.value = mode === "uv" ? 0 : mode === "triplanar" ? 1 : 2;
        uniforms.uSharpness.value = Number(params["sharpness"]);
        uniforms.uDebug.value = params["debug"] === true ? 1 : 0;
        rock.rotation.y += dt * 0.35;
        rock.rotation.x += dt * 0.12;
        pillar.rotation.y += dt * 0.2;
        context.readout(
          "岩の三角形",
          `${(rockGeometry.getAttribute("position").count / 3).toFixed(0)} 個`
        );
        context.caption(
          mode === "uv"
            ? "UV 展開に頼ると、球状の岩は極で模様が集まり、細長い柱は模様が引き伸ばされる。"
            : "面の法線の向きで x・y・z の 3 方向からの投影を混ぜる。UV がなくても、模様の大きさが形に関係なく一定になる。"
        );
      },
    };
  },
};
