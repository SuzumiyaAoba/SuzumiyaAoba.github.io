import {
  BufferAttribute,
  Color,
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RGBADepthPacking,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import type { BufferGeometry, Material } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { palette, rng, standard, TAU } from "../../kit";
import type { DemoModule } from "../../types";

const TREE_HEIGHT = 3.2;
const GRASS_COUNT = 6000;
const TRUNK = 0;
const BRANCH = 1;
const LEAF = 2;

type Part = {
  geometry: BufferGeometry;
  layer: number;
  anchor: Vector3;
  length: number;
  phase: number;
};

/** 部品ごとに、揺れの計算に使う値（根元・長さ・位相・層）を頂点属性として持たせる。 */
function tagged({ geometry, layer, anchor, length, phase }: Part) {
  const part = geometry.index ? geometry.toNonIndexed() : geometry;
  const { count } = part.getAttribute("position");
  const anchors = new Float32Array(count * 3);
  const values = new Float32Array(count * 3);
  for (let index = 0; index < count; index++) {
    anchors.set([anchor.x, anchor.y, anchor.z], index * 3);
    values.set([length, phase, layer], index * 3);
  }
  part.setAttribute("aAnchor", new BufferAttribute(anchors, 3));
  part.setAttribute("aWind", new BufferAttribute(values, 3));
  part.setAttribute(
    "color",
    new BufferAttribute(new Float32Array(count * 3), 3)
  );
  part.deleteAttribute("uv");
  return part;
}

const up = new Vector3(0, 1, 0);

/** 幹・枝・葉を 1 つのジオメトリにまとめた木。 */
function treeGeometry(seed: number) {
  const random = rng(seed);
  const parts: BufferGeometry[] = [];
  const cylinder = (start: Vector3, end: Vector3, r0: number, r1: number) => {
    const direction = end.clone().sub(start);
    const geometry = new CylinderGeometry(r1, r0, direction.length(), 8, 3);
    geometry.translate(0, direction.length() / 2, 0);
    geometry.applyQuaternion(
      new Quaternion().setFromUnitVectors(up, direction.clone().normalize())
    );
    geometry.translate(start.x, start.y, start.z);
    return geometry;
  };
  const leaf = (at: Vector3, size: number) => {
    const geometry = new PlaneGeometry(size, size * 1.6);
    const position = geometry.getAttribute("position");
    // ひし形の葉にする（上下の頂点を中央に寄せる）
    for (let index = 0; index < position.count; index++) {
      position.setX(
        index,
        position.getX(index) * (Math.abs(position.getY(index)) > 0 ? 0.55 : 1)
      );
    }
    geometry.translate(0, size * 0.8, 0);
    geometry.rotateX((random() - 0.5) * 2.4);
    geometry.rotateY(random() * TAU);
    geometry.rotateZ((random() - 0.5) * 1.6);
    geometry.translate(at.x, at.y, at.z);
    return geometry;
  };

  const trunkTop = new Vector3(0, TREE_HEIGHT * 0.72, 0);
  parts.push(
    tagged({
      geometry: cylinder(new Vector3(), trunkTop, 0.16, 0.07),
      layer: TRUNK,
      anchor: new Vector3(),
      length: 0,
      phase: 0,
    })
  );
  const branchCount = 7;
  for (let b = 0; b < branchCount; b++) {
    const angle = (b / branchCount) * TAU + random() * 0.6;
    const start = new Vector3(
      0,
      TREE_HEIGHT * (0.38 + (b / branchCount) * 0.34),
      0
    );
    const length = 0.9 + random() * 0.6;
    const direction = new Vector3(
      Math.cos(angle),
      0.55 + random() * 0.5,
      Math.sin(angle)
    ).normalize();
    const end = start.clone().addScaledVector(direction, length);
    const phase = random();
    parts.push(
      tagged({
        geometry: cylinder(start, end, 0.06, 0.02),
        layer: BRANCH,
        anchor: start,
        length,
        phase,
      })
    );
    for (let l = 0; l < 22; l++) {
      const t = 0.35 + random() * 0.65;
      const at = start
        .clone()
        .addScaledVector(direction, length * t)
        .add(
          new Vector3(
            (random() - 0.5) * 0.5,
            (random() - 0.3) * 0.4,
            (random() - 0.5) * 0.5
          )
        );
      parts.push(
        tagged({
          geometry: leaf(at, 0.17 + random() * 0.07),
          layer: LEAF,
          anchor: start,
          length,
          phase,
        })
      );
    }
  }
  // 幹の先の葉
  for (let l = 0; l < 30; l++) {
    const at = trunkTop
      .clone()
      .add(
        new Vector3(
          (random() - 0.5) * 0.9,
          random() * 0.7,
          (random() - 0.5) * 0.9
        )
      );
    parts.push(
      tagged({
        geometry: leaf(at, 0.17 + random() * 0.07),
        layer: LEAF,
        anchor: trunkTop,
        length: 0.8,
        phase: random(),
      })
    );
  }
  const merged = mergeGeometries(parts);
  for (const part of parts) {
    part.dispose();
  }
  return merged;
}

const windCommon = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  uniform vec2 uDir;
  uniform vec4 uLayers;
  // 風下へ流れていく突風：場所ごとに少し遅れて強まったり弱まったりする
  float windGust(vec2 p) {
    float along = dot(p, uDir);
    float wave = sin(along * 0.55 - uTime * 2.1 + sin(p.x * 0.23 - p.y * 0.19 + uTime * 0.35) * 2.2);
    return mix(1.0, 0.45 + 0.55 * (0.5 + 0.5 * wave) * 1.6, uLayers.w);
  }
`;

const treeVertex = /* glsl */ `
  attribute vec3 aAnchor;
  attribute vec3 aWind; // 枝の長さ・位相・層
  ${windCommon}
`;

const treeProject = /* glsl */ `
  vec3 root = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
  float gust = windGust(root.xz);
  // 1. 幹全体のしなり：高い所ほど大きく（高さの 2 乗）風下へ倒れる
  float h = max(transformed.y, 0.0) / ${TREE_HEIGHT.toFixed(2)};
  float bend = uStrength * gust * uLayers.x * h * h * 0.55;
  worldPos.xz += uDir * bend;
  worldPos.y -= bend * bend * 0.35;
  // 2. 枝ごとの揺れ：枝ごとに違う周期と位相で上下に振れる
  if (aWind.x > 0.0) {
    float along = clamp(length(transformed - aAnchor) / aWind.x, 0.0, 1.0);
    float swing = sin(uTime * (2.2 + aWind.y * 1.5) + aWind.y * 6.2831) * along * along;
    worldPos.y += swing * 0.16 * uStrength * gust * uLayers.y;
    worldPos.xz += uDir * swing * 0.08 * uStrength * uLayers.y;
  }
  // 3. 葉のはためき：速く細かく、葉ごとにばらばらに
  if (aWind.z > 1.5) {
    float seed = dot(transformed, vec3(12.9, 7.3, 4.1));
    worldPos.y += sin(uTime * 13.0 + seed) * 0.035 * uStrength * gust * uLayers.z;
    worldPos.xz += vec2(-uDir.y, uDir.x) * cos(uTime * 11.0 + seed * 1.3) * 0.03 * uStrength * gust * uLayers.z;
  }
  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;
`;

const grassVertex = /* glsl */ `
  ${windCommon}
`;

const grassProject = /* glsl */ `
  vec4 worldPos = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
  vec3 root = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float gust = windGust(root.xz);
  float h = uv.y;
  float seed = root.x * 7.1 + root.z * 3.7;
  // 草は細いので、しなり（突風）と細かな震えだけで十分に見える
  float sway = uStrength * gust * uLayers.x * 0.32 + sin(uTime * 3.5 + seed) * 0.04 * uStrength * uLayers.z;
  worldPos.xz += uDir * sway * h * h;
  worldPos.y -= sway * sway * h * 0.3;
  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;
`;

function applyWind(
  material: Material,
  uniforms: Record<string, { value: unknown }>,
  grass: boolean
) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\n${grass ? grassVertex : treeVertex}`
      )
      .replace("#include <project_vertex>", grass ? grassProject : treeProject);
  };
  material.customProgramCacheKey = () =>
    `wind-${grass ? "grass" : "tree"}-${material.type}`;
  return material;
}

export const demo: DemoModule = {
  alt: "木と草原を、骨組みのアニメーションを使わずに頂点シェーダーだけで風に揺らすデモ。幹は高い所ほど大きく風下へしなり、枝は枝ごとに違う周期で上下に振れ、葉は細かく速くはためく。さらに草原の上を突風が波のように通り過ぎる。揺れの層を 1 つずつ切り替えて、それぞれが見た目にどう効いているかを確かめられる。",
  camera: { position: [8, 5, 9.5], target: [0, 1.4, -1] },
  controls: [
    {
      type: "range",
      key: "strength",
      label: "風の強さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 1,
    },
    {
      type: "range",
      key: "direction",
      label: "風向き",
      min: 0,
      max: 360,
      step: 1,
      value: 20,
      format: (value) => `${value}°`,
    },
    { type: "toggle", key: "main", label: "幹のしなり", value: true },
    { type: "toggle", key: "branch", label: "枝の揺れ", value: true },
    { type: "toggle", key: "leaf", label: "葉のはためき", value: true },
    { type: "toggle", key: "gust", label: "突風の波", value: true },
    {
      type: "select",
      key: "color",
      label: "色",
      value: "natural",
      options: [
        { value: "natural", label: "自然な色" },
        { value: "layers", label: "層で色分け" },
      ],
    },
  ],
  legend: [
    { color: palette.amber, label: "幹（しなり）" },
    { color: palette.sky, label: "枝（揺れ）" },
    { color: palette.lime, label: "葉（はためき）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(12);
    // uLayers = (幹のしなり, 枝の揺れ, 葉のはためき, 突風) の on/off
    const windUniforms = {
      uTime: { value: 0 },
      uStrength: { value: 1 },
      uDir: { value: new Vector2(1, 0) },
      uLayers: { value: new Vector4(1, 1, 1, 1) },
    };

    const trees = [
      { seed: 3, x: 0, z: 0, scale: 1 },
      { seed: 8, x: -3.2, z: -2.4, scale: 0.8 },
      { seed: 15, x: 2.8, z: -3.2, scale: 0.9 },
    ];
    const treeMaterial = context.track(
      new MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        side: DoubleSide,
      })
    );
    const treeDepth = context.track(
      new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        side: DoubleSide,
      })
    );
    applyWind(treeMaterial, windUniforms, false);
    applyWind(treeDepth, windUniforms, false);
    const geometries = trees.map((tree) => {
      const geometry = context.track(treeGeometry(tree.seed));
      const mesh = new Mesh(geometry, treeMaterial);
      mesh.customDepthMaterial = treeDepth;
      mesh.position.set(tree.x, 0, tree.z);
      mesh.scale.setScalar(tree.scale);
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      scene.add(mesh);
      return geometry;
    });

    // 草原
    const blade = new PlaneGeometry(0.05, 0.34, 1, 4);
    blade.translate(0, 0.17, 0);
    const bladePosition = blade.getAttribute("position");
    for (let index = 0; index < bladePosition.count; index++) {
      bladePosition.setX(
        index,
        bladePosition.getX(index) * (1 - bladePosition.getY(index) / 0.38)
      );
    }
    const grassMaterial = context.track(
      new MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.9,
        side: DoubleSide,
      })
    );
    applyWind(grassMaterial, windUniforms, true);
    const grass = new InstancedMesh(
      context.track(blade),
      grassMaterial,
      GRASS_COUNT
    );
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const scale = new Vector3();
    const tint = new Color();
    for (let index = 0; index < GRASS_COUNT; index++) {
      const x = (random() - 0.5) * 16;
      const z = (random() - 0.5) * 16;
      rotation.setFromAxisAngle(up, random() * TAU);
      scale.set(1, 0.6 + random() * 0.9, 1);
      matrix.compose(new Vector3(x, 0, z), rotation, scale);
      grass.setMatrixAt(index, matrix);
      tint.setHSL(0.24 + random() * 0.06, 0.45, 0.28 + random() * 0.12);
      grass.setColorAt(index, tint);
    }
    grass.frustumCulled = false;
    scene.add(grass);

    const ground = new Mesh(
      new PlaneGeometry(16, 16),
      standard("#2f3a22", { roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.002;
    ground.receiveShadow = true;
    scene.add(ground);

    const layerColors = [
      new Color(palette.amber),
      new Color(palette.sky),
      new Color(palette.lime),
    ];
    const naturalColors = [
      new Color("#6b4a32"),
      new Color("#7a5a3e"),
      new Color("#4f8a3a"),
    ];
    let colorMode = "";
    const paint = (mode: string) => {
      const colorSet = mode === "layers" ? layerColors : naturalColors;
      for (const geometry of geometries) {
        const wind = geometry.getAttribute("aWind");
        const colors = geometry.getAttribute("color");
        for (let index = 0; index < wind.count; index++) {
          const layer = Math.round(wind.getZ(index));
          const base = colorSet[layer] ?? naturalColors[0];
          const shade =
            layer === LEAF && mode !== "layers"
              ? 0.85 + (((index * 7919) % 97) / 97) * 0.35
              : 1;
          colors.setXYZ(
            index,
            (base?.r ?? 0) * shade,
            (base?.g ?? 0) * shade,
            (base?.b ?? 0) * shade
          );
        }
        colors.needsUpdate = true;
      }
    };

    return {
      update({ time }) {
        windUniforms.uTime.value = time;
        const strength = Number(params["strength"]);
        windUniforms.uStrength.value = strength;
        const angle = (Number(params["direction"]) * Math.PI) / 180;
        windUniforms.uDir.value.set(Math.cos(angle), Math.sin(angle));
        const layerState = windUniforms.uLayers.value;
        layerState.x = params["main"] === true ? 1 : 0;
        layerState.y = params["branch"] === true ? 1 : 0;
        layerState.z = params["leaf"] === true ? 1 : 0;
        layerState.w = params["gust"] === true ? 1 : 0;
        const mode = String(params["color"]);
        if (mode !== colorMode) {
          colorMode = mode;
          paint(mode);
        }
        context.readout("草", `${GRASS_COUNT.toLocaleString("ja-JP")} 本`);
        context.caption(
          "骨組みを使わず、頂点シェーダーで位置をずらすだけで揺らしている。幹は高い所ほど風下へしなり、枝は枝ごとの周期で上下に振れ、葉は細かくはためく。草原を渡る明暗の波が突風。"
        );
      },
    };
  },
};
