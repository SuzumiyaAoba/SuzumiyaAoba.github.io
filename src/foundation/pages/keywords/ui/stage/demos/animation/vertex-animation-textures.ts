import {
  BufferAttribute,
  ConeGeometry,
  DataTexture,
  FloatType,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  PlaneGeometry,
  Quaternion,
  RGBAFormat,
  SphereGeometry,
  Vector3,
} from "three";
import type { BufferGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";

const MAX_FISH = 1500;

/** 魚の形（体 + 尾びれ）。+Z が頭。 */
function fishGeometry() {
  const body = new SphereGeometry(0.5, 20, 12);
  body.scale(0.22, 0.34, 1);
  const tail = new ConeGeometry(0.22, 0.4, 4);
  tail.rotateX(Math.PI / 2);
  tail.scale(0.15, 1, 1);
  tail.translate(0, 0, -0.62);
  const merged = mergeGeometries([body.toNonIndexed(), tail.toNonIndexed()]);
  body.dispose();
  tail.dispose();
  return merged;
}

/** 泳ぐ動き：頭から尾へ向かって、横に振れる波が伝わる。 */
function swim(rest: Float32Array, out: Float32Array, t: number) {
  for (let i = 0; i < rest.length / 3; i++) {
    const x = rest[i * 3] ?? 0;
    const y = rest[i * 3 + 1] ?? 0;
    const z = rest[i * 3 + 2] ?? 0;
    const tailward = Math.max(0, 0.35 - z); // 頭（+Z）はほとんど動かず、尾ほど大きく振れる
    const sway = Math.sin(t * Math.PI * 2 - z * 4) * tailward * 0.22;
    out[i * 3] = x + sway;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z - Math.abs(sway) * 0.1;
  }
}

/** 全フレームの頂点位置と法線を、テクスチャ（横 = 頂点、縦 = フレーム）に焼き込む。 */
function bake(geometry: BufferGeometry, frames: number) {
  const position = geometry.getAttribute("position");
  const { count } = position;
  const rest = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    rest.set([position.getX(i), position.getY(i), position.getZ(i)], i * 3);
  }
  const positions = new Float32Array(count * frames * 4);
  const normals = new Float32Array(count * frames * 4);
  const temp = geometry.clone();
  const tempPosition = temp.getAttribute("position");
  const moved = new Float32Array(count * 3);
  for (let f = 0; f < frames; f++) {
    swim(rest, moved, f / frames);
    for (let i = 0; i < count; i++) {
      tempPosition.setXYZ(
        i,
        moved[i * 3] ?? 0,
        moved[i * 3 + 1] ?? 0,
        moved[i * 3 + 2] ?? 0
      );
    }
    temp.computeVertexNormals();
    const normal = temp.getAttribute("normal");
    for (let i = 0; i < count; i++) {
      const k = (f * count + i) * 4;
      positions[k] = moved[i * 3] ?? 0;
      positions[k + 1] = moved[i * 3 + 1] ?? 0;
      positions[k + 2] = moved[i * 3 + 2] ?? 0;
      positions[k + 3] = 1;
      normals[k] = normal.getX(i);
      normals[k + 1] = normal.getY(i);
      normals[k + 2] = normal.getZ(i);
      normals[k + 3] = 1;
    }
  }
  temp.dispose();
  const make = (data: Float32Array) => {
    const texture = new DataTexture(data, count, frames, RGBAFormat, FloatType);
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.needsUpdate = true;
    return texture;
  };
  return { position: make(positions), normal: make(normals), count, positions };
}

export const demo: DemoModule = {
  alt: "頂点アニメーションテクスチャ（VAT）で、泳ぐ魚の大群を GPU だけで動かすデモ。1 匹の魚の泳ぐ動きを、あらかじめ全フレームぶん計算し、各頂点の位置を画像の画素（横が頂点、縦がフレーム）として焼き込んでおく。描くときは、頂点シェーダーが画像から今のフレームの位置を読むだけなので、何百匹いても、骨の計算をまったくせずにアニメーションできる。魚ごとに再生の開始位置をずらして、動きをばらけさせている。",
  camera: { position: [0, 3.4, 10.5], target: [0, 2.2, 0] },
  studio: { floor: false, background: "#06202c" },
  controls: [
    {
      type: "range",
      key: "count",
      label: "魚の数",
      min: 50,
      max: MAX_FISH,
      step: 50,
      value: 800,
    },
    {
      type: "range",
      key: "frames",
      label: "焼き込むフレーム数",
      min: 4,
      max: 64,
      step: 1,
      value: 24,
      hint: "少ないと動きがカクカクします（フレームの間は補間しています）。",
    },
    {
      type: "range",
      key: "speed",
      label: "泳ぐ速さ",
      min: 0.2,
      max: 3,
      step: 0.05,
      value: 1.4,
    },
    {
      type: "toggle",
      key: "texture",
      label: "焼き込んだ画像を表示",
      value: true,
    },
  ],
  legend: [
    { color: palette.amber, label: "魚（すべて 1 回の描画命令）" },
    { color: palette.sky, label: "頂点の位置を焼き込んだ画像" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(3);
    const geometry = context.track(fishGeometry());
    const vertexCount = geometry.getAttribute("position").count;
    const vertexIds = new Float32Array(vertexCount).map((_, i) => i);
    geometry.setAttribute("aVertex", new BufferAttribute(vertexIds, 1));
    const offsets = new Float32Array(MAX_FISH).map(() => random());
    geometry.setAttribute("aOffset", new InstancedBufferAttribute(offsets, 1));

    const uniforms = {
      uPositions: { value: null as DataTexture | null },
      uNormals: { value: null as DataTexture | null },
      uFrames: { value: 24 },
      uVertices: { value: vertexCount },
      uTime: { value: 0 },
    };
    const material = new MeshStandardMaterial({
      color: "#f2b25c",
      roughness: 0.35,
      metalness: 0.2,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform sampler2D uPositions;
          uniform sampler2D uNormals;
          uniform float uFrames;
          uniform float uVertices;
          uniform float uTime;
          attribute float aVertex;
          attribute float aOffset;
          vec2 vatUv(float frame) { return vec2((aVertex + 0.5) / uVertices, (mod(frame, uFrames) + 0.5) / uFrames); }`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `// 魚ごとにずらした再生位置から、前後 2 フレームを読んで補間する
          float vatFrame = fract(uTime + aOffset) * uFrames;
          float vatA = floor(vatFrame);
          float vatT = vatFrame - vatA;
          vec3 objectNormal = normalize(mix(texture2D(uNormals, vatUv(vatA)).xyz, texture2D(uNormals, vatUv(vatA + 1.0)).xyz, vatT));`
        )
        .replace(
          "#include <begin_vertex>",
          "vec3 transformed = mix(texture2D(uPositions, vatUv(vatA)).xyz, texture2D(uPositions, vatUv(vatA + 1.0)).xyz, vatT);"
        );
    };
    material.customProgramCacheKey = () => "vat-fish";
    const school = new InstancedMesh(geometry, material, MAX_FISH);
    school.frustumCulled = false;
    scene.add(school);

    // 焼き込んだ画像の表示
    const panelMaterial = new MeshBasicMaterial({ toneMapped: false });
    const panel = new Mesh(new PlaneGeometry(3.2, 1.6), panelMaterial);
    panel.position.set(0, 5.5, -3);
    scene.add(panel);
    const label = context.label("焼き込んだ画像（横 = 頂点、縦 = フレーム）", {
      size: "sm",
    });
    label.position.set(0, 6.45, -3);
    scene.add(label);

    let bakedFrames = 0;
    let preview: DataTexture | null = null;
    const rebake = (frames: number) => {
      const baked = bake(geometry, frames);
      uniforms.uPositions.value?.dispose();
      uniforms.uNormals.value?.dispose();
      uniforms.uPositions.value = baked.position;
      uniforms.uNormals.value = baked.normal;
      uniforms.uFrames.value = frames;
      // 表示用：位置の x・y・z を色に置き換えた 8 ビット画像
      const pixels = new Uint8Array(baked.count * frames * 4);
      for (let i = 0; i < baked.count * frames; i++) {
        pixels[i * 4] = Math.round(((baked.positions[i * 4] ?? 0) + 0.5) * 255);
        pixels[i * 4 + 1] = Math.round(
          ((baked.positions[i * 4 + 1] ?? 0) + 0.5) * 255
        );
        pixels[i * 4 + 2] = Math.round(
          ((baked.positions[i * 4 + 2] ?? 0) * 0.5 + 0.5) * 255
        );
        pixels[i * 4 + 3] = 255;
      }
      preview?.dispose();
      preview = new DataTexture(pixels, baked.count, frames, RGBAFormat);
      preview.magFilter = NearestFilter;
      preview.needsUpdate = true;
      panelMaterial.map = preview;
      panelMaterial.needsUpdate = true;
      bakedFrames = frames;
    };

    // 魚ごとの泳ぐ軌道（大きな渦を描いて回遊する）
    const fish = Array.from({ length: MAX_FISH }, () => ({
      radius: 1.5 + random() * 3.5,
      height: 0.4 + random() * 3.2,
      angle: random() * Math.PI * 2,
      speed: 0.3 + random() * 0.25,
      wobble: random() * 10,
      scale: 0.25 + random() * 0.15,
    }));
    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const scale = new Vector3();
    const p = new Vector3();
    let time = 0;

    return {
      dispose() {
        uniforms.uPositions.value?.dispose();
        uniforms.uNormals.value?.dispose();
        preview?.dispose();
      },
      update({ dt }) {
        const frames = Number(params["frames"]);
        if (frames !== bakedFrames) {
          rebake(frames);
        }
        time += dt;
        uniforms.uTime.value = time * Number(params["speed"]);
        const count = Number(params["count"]);
        school.count = count;
        for (let i = 0; i < count; i++) {
          const f = fish[i];
          if (!f) {
            continue;
          }
          const angle = f.angle + time * f.speed;
          p.set(
            Math.cos(angle) * f.radius,
            f.height + Math.sin(time + f.wobble) * 0.15,
            Math.sin(angle) * f.radius
          );
          // 進む向き（円の接線）に頭（+Z）を向ける
          quaternion.setFromAxisAngle(up, -angle);
          scale.setScalar(f.scale);
          matrix.compose(p, quaternion, scale);
          school.setMatrixAt(i, matrix);
        }
        school.instanceMatrix.needsUpdate = true;
        panel.visible = params["texture"] === true;
        label.visible = panel.visible;
        context.readout("魚の数", `${count}`);
        context.readout("1 匹の頂点数", `${vertexCount}`);
        context.readout("画像の大きさ", `${vertexCount}×${frames}`);
        context.caption(
          "泳ぐ動きは焼き込み済みなので、実行中は頂点シェーダーが画像から「自分の頂点の、今のフレームの位置」を読むだけ。骨やスキニングの計算がいらないので、群衆や魚群、草木など、同じ動きをする物を大量に出すのに向いている。"
        );
      },
    };
  },
};
