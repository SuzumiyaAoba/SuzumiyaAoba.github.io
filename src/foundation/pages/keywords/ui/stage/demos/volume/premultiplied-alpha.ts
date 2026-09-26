import {
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  DataTexture,
  LinearFilter,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  Points,
  RGBAFormat,
  ShaderMaterial,
  SrcAlphaFactor,
} from "three";
import { clamp, palette, rng, smoothstep } from "../../kit";
import type { DemoModule } from "../../types";

const SIZE = 24;
const PARTICLES = 160;

/** 葉の形の被覆率（0〜1）。u, v は -1〜1。 */
function leafCoverage(u: number, v: number) {
  const x = u * 1.3;
  const y = v * 1.18;
  const width = 0.55 * Math.sqrt(Math.max(0, 1 - y * y)) * (1 - 0.25 * y);
  const edge = width - Math.abs(x);
  const vein = Math.abs(x) < 0.03 && y > -0.95 ? 0.35 : 0;
  return { alpha: smoothstep(-0.04, 0.04, edge), vein };
}

/** 3 通りの葉のテクスチャ：透明部分が黒のストレート / 色を広げたストレート / 乗算済み。 */
function leafTextures() {
  const straightBlack = new Uint8Array(SIZE * SIZE * 4);
  const straightBleed = new Uint8Array(SIZE * SIZE * 4);
  const premultiplied = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = ((x + 0.5) / SIZE) * 2 - 1;
      const v = ((y + 0.5) / SIZE) * 2 - 1;
      const { alpha, vein } = leafCoverage(u, v);
      const green = [0.45 + vein * 0.4, 0.85 + vein * 0.1, 0.3 + vein * 0.2];
      const index = (y * SIZE + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const value = clamp(green[channel] ?? 0);
        straightBlack[index + channel] = alpha > 0.001 ? value * 255 : 0;
        straightBleed[index + channel] = value * 255;
        premultiplied[index + channel] = value * alpha * 255;
      }
      straightBlack[index + 3] = alpha * 255;
      straightBleed[index + 3] = alpha * 255;
      premultiplied[index + 3] = alpha * 255;
    }
  }
  const make = (data: Uint8Array) => {
    const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat);
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.needsUpdate = true;
    return texture;
  };
  return {
    straightBlack: make(straightBlack),
    straightBleed: make(straightBleed),
    premultiplied: make(premultiplied),
  };
}

export const demo: DemoModule = {
  alt: "乗算済みアルファのデモ。上は、同じ小さな葉の画像を大きく拡大したもの。色と透明度を別々に持つ（ストレート）画像で、透明な部分の色が黒いと、補間で縁に黒い線が出る。あらかじめ色に不透明度を掛けておく（乗算済み）と、補間しても縁がきれいになる。下は、乗算済みの合成を使って、光る炎（加算）と暗い煙（通常の半透明）を 1 回の描画で混ぜた粒子。",
  camera: { position: [0, 2.3, 7.4], target: [0, 2.1, 0] },
  controls: [
    {
      type: "toggle",
      key: "premultiplied",
      label: "粒子を乗算済みアルファで合成",
      value: true,
      hint: "オフにすると通常の（ストレートな）アルファ合成になり、不透明度の低い炎がほとんど見えなくなります。",
    },
    { type: "toggle", key: "zoom", label: "葉をさらに拡大", value: false },
  ],
  legend: [
    { color: palette.amber, label: "炎：不透明度 0（加算）" },
    { color: palette.muted, label: "煙：不透明度 1（通常の半透明）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const textures = leafTextures();
    for (const texture of Object.values(textures)) {
      context.track(texture);
    }
    // 明るい空の窓（葉の縁の黒ずみが目立つ背景）
    const sky = new Mesh(
      new PlaneGeometry(8.4, 2.6),
      new ShaderMaterial({
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vec3 color = mix(vec3(0.95, 0.93, 0.85), vec3(0.62, 0.8, 0.98), vUv.y);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      })
    );
    sky.position.set(0, 3, -0.4);
    scene.add(sky);

    const leafVertex = /* glsl */ `
      varying vec2 vUv;
      uniform float uZoom;
      void main() {
        vUv = (uv - 0.5) / uZoom + 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const zoom = { value: 1 };
    const leaf = (map: DataTexture, premultiplied: boolean) =>
      new ShaderMaterial({
        uniforms: { uMap: { value: map }, uZoom: zoom },
        vertexShader: leafVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          varying vec2 vUv;
          void main() {
            gl_FragColor = texture2D(uMap, vUv);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: CustomBlending,
        blendSrc: premultiplied ? OneFactor : SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
      });
    const leaves = [
      {
        material: leaf(textures.straightBlack, false),
        title: "ストレート（透明部分が黒）",
      },
      {
        material: leaf(textures.straightBleed, false),
        title: "ストレート（色を外へ広げて対策）",
      },
      {
        material: leaf(textures.premultiplied, true),
        title: "乗算済みアルファ",
      },
    ];
    for (const [index, { material, title }] of leaves.entries()) {
      const mesh = new Mesh(new PlaneGeometry(2.3, 2.3), material);
      mesh.position.set((index - 1) * 2.7, 3, -0.3);
      const label = context.label(title, { size: "md" });
      label.position.set((index - 1) * 2.7, 1.55, -0.3);
      scene.add(mesh, label);
    }

    // 炎と煙を 1 回で描く粒子
    const random = rng(4);
    const positions = new Float32Array(PARTICLES * 3);
    const colors = new Float32Array(PARTICLES * 4);
    const sizes = new Float32Array(PARTICLES);
    const ages = Float32Array.from({ length: PARTICLES }, () => random());
    const seeds = Float32Array.from({ length: PARTICLES }, () => random());
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("tint", new BufferAttribute(colors, 4));
    geometry.setAttribute("size", new BufferAttribute(sizes, 1));
    const particleUniforms = {
      uPremultiplied: { value: 1 },
      uPixelRatio: { value: Math.min(2, window.devicePixelRatio || 1) },
    };
    const particleMaterial = new ShaderMaterial({
      uniforms: particleUniforms,
      vertexShader: /* glsl */ `
        attribute vec4 tint;
        attribute float size;
        uniform float uPixelRatio;
        varying vec4 vTint;
        void main() {
          vTint = tint;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = size * uPixelRatio * 300.0 / -mv.z;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uPremultiplied;
        varying vec4 vTint;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float coverage = smoothstep(1.0, 0.0, d);
          coverage *= coverage;
          // tint.a は「不透明さ」：0 なら加算（光る炎）、1 なら通常の半透明（煙）
          vec3 color = vTint.rgb * coverage;
          float alpha = vTint.a * coverage;
          if (uPremultiplied > 0.5) {
            gl_FragColor = vec4(color, alpha);
          } else {
            gl_FragColor = vec4(vTint.rgb, alpha);
          }
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
    });
    const particles = new Points(geometry, particleMaterial);
    particles.frustumCulled = false;
    particles.position.set(0, 0, 1.2);
    scene.add(particles);
    const fireLabel = context.label("炎と煙（1 回の描画）", { tone: "muted" });
    fireLabel.position.set(1.4, 0.4, 1.2);
    scene.add(fireLabel);

    return {
      update({ dt }) {
        const premultiplied = params["premultiplied"] === true;
        particleUniforms.uPremultiplied.value = premultiplied ? 1 : 0;
        particleMaterial.blendSrc = premultiplied ? OneFactor : SrcAlphaFactor;
        zoom.value = params["zoom"] === true ? 2.2 : 1;
        for (let index = 0; index < PARTICLES; index++) {
          const age = ((ages[index] ?? 0) + dt / 2.2) % 1;
          ages[index] = age;
          const seed = seeds[index] ?? 0;
          const spread = 0.12 + age * 0.5;
          positions[index * 3] = Math.sin(seed * 40 + age * 3) * spread;
          positions[index * 3 + 1] = age * 1.4;
          positions[index * 3 + 2] = Math.cos(seed * 31) * spread * 0.4;
          // 若い粒子は光る炎（不透明度 0）、年老いた粒子は暗い煙（不透明度 1）へ変わる
          const smoke = smoothstep(0.25, 0.55, age);
          const fade = 1 - smoothstep(0.7, 1, age);
          colors[index * 4] = (1.6 * (1 - smoke) + 0.18 * smoke) * fade;
          colors[index * 4 + 1] = (0.7 * (1 - smoke) + 0.17 * smoke) * fade;
          colors[index * 4 + 2] = (0.2 * (1 - smoke) + 0.18 * smoke) * fade;
          colors[index * 4 + 3] = smoke * 0.75 * fade;
          sizes[index] = 0.25 + age * 0.5;
        }
        for (const name of ["position", "tint", "size"]) {
          const attribute = geometry.getAttribute(name);
          attribute.needsUpdate = true;
        }
        context.caption(
          premultiplied
            ? "乗算済みアルファなら、同じ合成方法のまま、不透明度 0 の粒子は加算（光）、1 の粒子は通常の半透明（煙）になる。炎が煙に変わる粒子を 1 回で描ける。"
            : "通常のアルファ合成では、不透明度の低い炎の粒子はほとんど何も足さず、光る炎が消えてしまう。炎と煙を別々の合成方法で 2 回描く必要がある。"
        );
      },
    };
  },
};
