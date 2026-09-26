import {
  Color,
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { palette, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";

const BLADES = 4200;
const BLADE_HEIGHT = 0.55;

const windChunk = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform float uEnabled;
  float gust(vec2 p) {
    return 0.6 + 0.4 * sin(p.x * 0.35 - uTime * 1.3) * sin(p.y * 0.27 + uTime * 0.7);
  }
`;

function grassGeometry() {
  const blades = [0, Math.PI / 2].map((angle) => {
    const plane = new PlaneGeometry(0.07, BLADE_HEIGHT, 1, 5);
    plane.translate(0, BLADE_HEIGHT / 2, 0);
    const position = plane.getAttribute("position");
    for (let index = 0; index < position.count; index++) {
      const y = position.getY(index);
      position.setX(
        index,
        position.getX(index) * Math.max(0, 1 - y / BLADE_HEIGHT) ** 0.8
      );
    }
    plane.rotateY(angle);
    return plane;
  });
  const merged = mergeGeometries(blades);
  // 草は薄い板なので、裏表で明暗が割れないよう法線をすべて上向きにする
  const normal = merged.getAttribute("normal");
  for (let index = 0; index < normal.count; index++) {
    normal.setXYZ(index, 0, 1, 0);
  }
  return merged;
}

export const demo: DemoModule = {
  alt: "風にそよぐ草原と、はためく旗のデモ。草も旗もメッシュの形は固定で、頂点シェーダーの中で頂点の位置を時間と場所に応じてずらしている。草は根元を固定して先端ほど大きく、旗は竿から遠いほど大きく揺らす。変位を止めると、ただの静止したメッシュに戻る。",
  camera: { position: [4.6, 2.2, 5.4], target: [0, 0.9, 0] },
  controls: [
    { type: "toggle", key: "enabled", label: "頂点変位", value: true },
    {
      type: "range",
      key: "wind",
      label: "風の強さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 1,
    },
    {
      type: "toggle",
      key: "wire",
      label: "旗の頂点（ワイヤーフレーム）",
      value: false,
    },
  ],
  legend: [
    { color: palette.lime, label: "草（先端ほど大きく変位）" },
    { color: palette.coral, label: "旗（竿から遠いほど大きく変位）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(14);
    const uniforms = {
      uTime: { value: 0 },
      uWind: { value: 1 },
      uEnabled: { value: 1 },
    };

    const ground = new Mesh(
      new PlaneGeometry(14, 14),
      standard("#2d3a22", { roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grassMaterial = new MeshStandardMaterial({
      roughness: 0.8,
      side: DoubleSide,
    });
    grassMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>\n${windChunk}\nvarying float vTip;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vec3 root = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float tip = clamp(position.y / ${BLADE_HEIGHT.toFixed(2)}, 0.0, 1.0);
          vTip = tip;
          float bend = tip * tip * uWind * uEnabled;
          float sway = sin(uTime * 2.4 + root.x * 1.3 + root.z * 0.7) * 0.35 + gust(root.xz) * 0.8;
          transformed.x += bend * sway * 0.35;
          transformed.z += bend * sin(uTime * 1.9 + root.x) * 0.1;
          transformed.y -= bend * abs(sway) * 0.08;`
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vTip;")
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          diffuseColor.rgb *= mix(vec3(0.25, 0.35, 0.12), vec3(0.85, 1.0, 0.55), vTip);`
        );
    };
    grassMaterial.customProgramCacheKey = () => "wind-grass";
    const grass = new InstancedMesh(grassGeometry(), grassMaterial, BLADES);
    const matrix = new Matrix4();
    const tint = new Color();
    for (let index = 0; index < BLADES; index++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * 5.5;
      const scale = 0.6 + random() * 0.8;
      matrix.compose(
        new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
        new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), random() * 0.6),
        new Vector3(1, scale, 1)
      );
      grass.setMatrixAt(index, matrix);
      grass.setColorAt(
        index,
        tint.setHSL(0.22 + random() * 0.06, 0.55, 0.35 + random() * 0.15)
      );
    }
    grass.receiveShadow = true;
    scene.add(grass);

    const pole = new Mesh(
      new CylinderGeometry(0.04, 0.05, 3.2, 12),
      standard("#b9c0cc", { metalness: 0.8, roughness: 0.3 })
    );
    pole.position.set(-1.2, 1.6, -0.6);
    pole.castShadow = true;
    scene.add(pole);
    const flagMaterial = new MeshStandardMaterial({
      color: palette.coral,
      roughness: 0.7,
      side: DoubleSide,
    });
    const injectFlag: MeshStandardMaterial["onBeforeCompile"] = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\n${windChunk}`)
        .replace(
          "#include <beginnormal_vertex>",
          `float along = uv.x;
          float amplitude = along * 0.22 * uWind * uEnabled;
          float wave = position.x * 3.2 - uTime * 7.0 * (0.5 + uWind * 0.5);
          float ripple = sin(wave) + 0.35 * sin(wave * 2.1 + position.y * 3.0);
          float dzdx = amplitude * (cos(wave) * 3.2 + 0.35 * cos(wave * 2.1 + position.y * 3.0) * 6.72);
          vec3 objectNormal = normalize(vec3(-dzdx, 0.0, 1.0));`
        )
        .replace(
          "#include <begin_vertex>",
          `vec3 transformed = vec3(position);
          transformed.z += ripple * amplitude;
          transformed.y -= along * along * 0.12 * (1.0 - min(uWind, 1.0)) * uEnabled;`
        );
    };
    flagMaterial.onBeforeCompile = injectFlag;
    flagMaterial.customProgramCacheKey = () => "wind-flag";
    const flagGeometry = new PlaneGeometry(1.8, 1.1, 40, 24);
    flagGeometry.translate(0.9, 0, 0);
    const flag = new Mesh(flagGeometry, flagMaterial);
    flag.position.set(-1.2, 2.6, -0.6);
    flag.castShadow = true;
    scene.add(flag);
    const wireMaterial = flagMaterial.clone();
    wireMaterial.wireframe = true;
    wireMaterial.color.set("#ffffff");
    wireMaterial.onBeforeCompile = injectFlag;
    wireMaterial.customProgramCacheKey = () => "wind-flag-wire";
    const wire = new Mesh(flagGeometry, wireMaterial);
    wire.position.copy(flag.position);
    wire.position.z += 0.002;
    scene.add(wire);

    return {
      update({ dt }) {
        uniforms.uTime.value += dt;
        uniforms.uWind.value = Number(params["wind"]);
        uniforms.uEnabled.value = params["enabled"] === true ? 1 : 0;
        wire.visible = params["wire"] === true;
        context.readout(
          "草",
          `${BLADES.toLocaleString("ja-JP")} 本（1 回の描画）`
        );
        context.readout(
          "旗の頂点",
          `${flagGeometry.getAttribute("position").count} 個`
        );
        context.caption(
          params["enabled"] === true
            ? "CPU は何も動かしていない。頂点シェーダーが、時間・位置・揺れの重み（草は高さ、旗は竿からの距離）から毎フレーム頂点をずらしている。"
            : "頂点変位を止めると、草も旗も作ったときの形のまま動かない。"
        );
      },
    };
  },
};
