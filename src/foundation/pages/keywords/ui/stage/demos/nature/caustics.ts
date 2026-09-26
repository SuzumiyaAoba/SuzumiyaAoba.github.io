import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  HalfFloatType,
  LinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderTarget,
} from "three";
import { palette, segments } from "../../kit";
import type { DemoModule } from "../../types";
import {
  gerstnerPoint,
  glslGerstner,
  waveSet,
  waveUniforms,
} from "../../waves";

const POOL = 8;
const HALF = POOL / 2;
const RESOLUTION = 512;
const ETA = 1 / 1.33;
const RAY_COUNT = 13;

/** プールの底のタイル模様。 */
function tileTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context2d = canvas.getContext("2d");
  if (context2d) {
    context2d.fillStyle = "#9ec9d6";
    context2d.fillRect(0, 0, 256, 256);
    context2d.strokeStyle = "#6f9fb0";
    context2d.lineWidth = 4;
    for (let index = 0; index <= 8; index++) {
      const offset = index * 32;
      context2d.beginPath();
      context2d.moveTo(offset, 0);
      context2d.lineTo(offset, 256);
      context2d.moveTo(0, offset);
      context2d.lineTo(256, offset);
      context2d.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/**
 * 水面の格子を 1 枚ずつ光の束とみなし、屈折した先（プールの底）へ頂点を移して描く。
 * 束が狭い面積に集まるほど明るく、広がるほど暗い（面積の比 = 明るさ）。
 */
const causticVertex = /* glsl */ `
  ${glslGerstner}
  uniform vec3 uLight;
  uniform float uFloor;
  varying vec3 vFlat;
  varying vec3 vBent;
  vec3 hitFloor(vec3 origin, vec3 normal) {
    vec3 ray = refract(uLight, normal, ${ETA.toFixed(4)});
    return origin + ray * ((uFloor - origin.y) / ray.y);
  }
  void main() {
    vec3 normal;
    float jacobian;
    vec3 surface = gerstner(position.xz, normal, jacobian);
    // 波がなければ届いたはずの場所と、実際に届いた場所
    vFlat = hitFloor(vec3(position.x, 0.0, position.z), vec3(0.0, 1.0, 0.0));
    vBent = hitFloor(surface, normal);
    gl_Position = vec4(vBent.x / ${HALF.toFixed(1)}, -vBent.z / ${HALF.toFixed(1)}, 0.0, 1.0);
  }
`;

const causticFragment = /* glsl */ `
  varying vec3 vFlat;
  varying vec3 vBent;
  void main() {
    float flatArea = length(cross(dFdx(vFlat), dFdy(vFlat)));
    float bentArea = length(cross(dFdx(vBent), dFdy(vBent)));
    float intensity = flatArea / max(bentArea, 1e-7);
    gl_FragColor = vec4(vec3(min(intensity, 6.0)), 1.0);
  }
`;

export const demo: DemoModule = {
  alt: "プールの底に揺れる光の網目模様（コースティクス）を、水面で屈折した光がどこに集まるかを計算して描くデモ。波打つ水面の小さな区画ごとに、太陽の光が屈折して底のどこに届くかを求め、光が狭い範囲に集まった所は明るく、広がった所は暗く塗る。ゲームでよく使われる、模様の画像を流すだけの安価な方法とも比べられる。",
  camera: { position: [7, 7.5, 9], target: [0, -1.4, 0] },
  studio: { floor: false, fog: false, background: "#10202c" },
  controls: [
    {
      type: "select",
      key: "method",
      label: "コースティクスの作り方",
      value: "refract",
      options: [
        { value: "refract", label: "屈折を計算する" },
        { value: "fake", label: "模様を流すだけ（安価）" },
        { value: "none", label: "なし" },
      ],
    },
    {
      type: "range",
      key: "height",
      label: "波の高さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 1,
    },
    {
      type: "range",
      key: "depth",
      label: "水深",
      min: 0.8,
      max: 4,
      step: 0.05,
      value: 2.4,
      hint: "深いほど光の束が底に届くまでに交差し、模様が細かく鋭くなります。",
    },
    {
      type: "range",
      key: "sun",
      label: "太陽の高さ",
      min: 30,
      max: 90,
      step: 1,
      value: 70,
      format: (value) => `${value}°`,
    },
    { type: "toggle", key: "rays", label: "光の経路を表示", value: true },
    { type: "toggle", key: "surface", label: "水面を表示", value: true },
  ],
  legend: [
    { color: palette.amber, label: "水面で屈折した光" },
    { color: palette.sky, label: "水面" },
  ],
  setup(context) {
    const { scene, params, renderer } = context;
    const state = waveUniforms(
      waveSet({ seed: 11, wavelength: 1.6, amplitude: 0.055, spread: 1.4 })
    );
    state.uGerstner.value = 0;
    state.uWaveCount.value = 8;
    const light = new Vector3(0, -1, 0);
    const floorUniform = { value: -2.4 };

    // コースティクスを描き込むテクスチャ（プールの底を真上から見た画像）
    const target = context.track(
      new WebGLRenderTarget(RESOLUTION, RESOLUTION, {
        type: HalfFloatType,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
      })
    );
    const causticScene = new Scene();
    const causticCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const causticGeometry = context.track(
      new PlaneGeometry(POOL * 1.4, POOL * 1.4, 300, 300)
    );
    causticGeometry.rotateX(-Math.PI / 2);
    const causticMaterial = context.track(
      new ShaderMaterial({
        uniforms: { ...state, uLight: { value: light }, uFloor: floorUniform },
        vertexShader: causticVertex,
        fragmentShader: causticFragment,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        transparent: true,
      })
    );
    const causticMesh = new Mesh(causticGeometry, causticMaterial);
    causticMesh.frustumCulled = false;
    causticScene.add(causticMesh);

    // プールの底：直射光の代わりにコースティクスのテクスチャで照らす
    const uniforms = {
      uCaustic: { value: target.texture },
      uMethod: { value: 0 },
      uTime: state.uTime,
      uSunColor: { value: new Color("#fff1d6") },
      uHalf: { value: HALF },
    };
    const tiles = context.track(tileTexture());
    tiles.repeat.set(2, 2);
    const floorMaterial = new MeshPhysicalMaterial({
      map: tiles,
      roughness: 0.7,
    });
    floorMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
        .replace(
          "#include <worldpos_vertex>",
          "#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;"
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform sampler2D uCaustic;
          uniform float uMethod;
          uniform float uTime;
          uniform vec3 uSunColor;
          uniform float uHalf;
          varying vec3 vWorld;
          // 安価な方法：ずらした 2 枚の網目模様を重ね、明るい線だけを残す
          float fakeLayer(vec2 p) {
            vec2 q = p + vec2(sin(p.y * 1.7 + uTime * 0.9), cos(p.x * 1.5 - uTime * 0.7)) * 0.35;
            float lines = abs(sin(q.x * 3.1) * sin(q.y * 3.3));
            return pow(1.0 - lines, 6.0);
          }`
        )
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
          vec2 causticUv = vec2(vWorld.x, -vWorld.z) / (2.0 * uHalf) + 0.5;
          float caustic = 0.0;
          if (uMethod < 0.5) {
            caustic = texture2D(uCaustic, causticUv).r;
          } else if (uMethod < 1.5) {
            caustic = (fakeLayer(vWorld.xz * 1.3) + fakeLayer(vWorld.zx * 1.1 + 4.0)) * 1.1 + 0.25;
          } else {
            caustic = 1.0;
          }
          // 太陽の直射光を、コースティクスの明るさで置き換える
          reflectedLight.directDiffuse = diffuseColor.rgb * uSunColor * caustic * 0.9;`
        );
    };
    floorMaterial.customProgramCacheKey = () => "caustic-floor";
    const floor = new Mesh(new PlaneGeometry(POOL, POOL), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // プールの壁（上端は水面より少し上）
    const wallMaterial = new MeshPhysicalMaterial({
      map: tiles,
      roughness: 0.6,
      color: "#d5e6ea",
    });
    const walls = [
      { x: 0, z: -HALF - 0.2, w: POOL + 0.8, d: 0.4 },
      { x: -HALF - 0.2, z: 0, w: 0.4, d: POOL },
      { x: HALF + 0.2, z: 0, w: 0.4, d: POOL },
    ].map(({ x, z, w, d }) => {
      const wall = new Mesh(new BoxGeometry(w, 1, d), wallMaterial);
      wall.position.x = x;
      wall.position.z = z;
      scene.add(wall);
      return wall;
    });

    // 水面
    const surfaceMaterial = new MeshPhysicalMaterial({
      color: "#4fa3c0",
      roughness: 0.04,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    surfaceMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, state);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\n${glslGerstner}`)
        .replace(
          "#include <beginnormal_vertex>",
          `vec3 waveNormal;
          float waveJacobian;
          vec3 wavePosition = gerstner(position.xz, waveNormal, waveJacobian);
          vec3 objectNormal = waveNormal;`
        )
        .replace("#include <begin_vertex>", "vec3 transformed = wavePosition;");
    };
    surfaceMaterial.customProgramCacheKey = () => "caustic-surface";
    const surfaceGeometry = new PlaneGeometry(POOL, POOL, 160, 160);
    surfaceGeometry.rotateX(-Math.PI / 2);
    const surface = new Mesh(surfaceGeometry, surfaceMaterial);
    surface.frustumCulled = false;
    surface.renderOrder = 2;
    scene.add(surface);

    // 太陽の光の経路（CPU で同じ波を評価して屈折させる）
    const rays = segments([], palette.amber, { width: 1.6, opacity: 0.85 });
    scene.add(rays);
    const sunLight = scene.children.find(
      (child): child is DirectionalLight =>
        child instanceof DirectionalLight && child.castShadow
    );
    if (sunLight) {
      sunLight.castShadow = false;
    }
    const normal = new Vector3();
    const refracted = new Vector3();
    const rayPoints: Vector3[] = [];
    const surfaceNormal = (x: number, z: number) => {
      const e = 0.02;
      const dx =
        gerstnerPoint(state, x + e, z).y - gerstnerPoint(state, x - e, z).y;
      const dz =
        gerstnerPoint(state, x, z + e).y - gerstnerPoint(state, x, z - e).y;
      return normal.set(-dx / (2 * e), 1, -dz / (2 * e)).normalize();
    };
    const refract = (incident: Vector3, n: Vector3) => {
      const cosI = -n.dot(incident);
      const k = 1 - ETA * ETA * (1 - cosI * cosI);
      return refracted
        .copy(incident)
        .multiplyScalar(ETA)
        .addScaledVector(n, ETA * cosI - Math.sqrt(Math.max(k, 0)));
    };

    let time = 0;
    const clear = new Color();
    return {
      update({ dt }) {
        time += dt;
        state.uTime.value = time;
        state.uAmplitudeScale.value = Number(params["height"]);
        const depth = Number(params["depth"]);
        floorUniform.value = -depth;
        floor.position.y = -depth;
        for (const wall of walls) {
          wall.scale.y = depth + 0.3;
          wall.position.y = (0.3 - depth) / 2;
        }
        const elevation = (Number(params["sun"]) * Math.PI) / 180;
        light
          .set(
            Math.cos(elevation) * 0.6,
            -Math.sin(elevation),
            Math.cos(elevation) * 0.8
          )
          .normalize();
        sunLight?.position.copy(light).multiplyScalar(-12);
        const method = String(params["method"]);
        uniforms.uMethod.value =
          method === "refract" ? 0 : method === "fake" ? 1 : 2;
        surface.visible = params["surface"] === true;

        if (method === "refract") {
          renderer.getClearColor(clear);
          const alpha = renderer.getClearAlpha();
          renderer.setRenderTarget(target);
          renderer.setClearColor(0x00_00_00, 1);
          renderer.clear();
          renderer.render(causticScene, causticCamera);
          renderer.setRenderTarget(null);
          renderer.setClearColor(clear, alpha);
        }

        rays.visible = params["rays"] === true;
        if (rays.visible) {
          rayPoints.length = 0;
          for (let index = 0; index < RAY_COUNT; index++) {
            const x = -2.4 + (index / (RAY_COUNT - 1)) * 4.8;
            const z = 0.6;
            const { y } = gerstnerPoint(state, x, z);
            const entry = new Vector3(x, y, z);
            rayPoints.push(entry.clone().addScaledVector(light, -2.5), entry);
            const bent = refract(light, surfaceNormal(x, z));
            const hit = entry
              .clone()
              .addScaledVector(bent, (-depth - y) / bent.y);
            rayPoints.push(entry.clone(), hit);
          }
          rays.setPoints(rayPoints);
        }

        context.readout("水深", `${depth.toFixed(1)} m`);
        context.caption(
          method === "refract"
            ? "波打つ水面の小区画ごとに、太陽の光が屈折して底のどこに届くかを計算する。光の束が狭い範囲に集まった所は明るい線に、広がった所は暗くなる。"
            : method === "fake"
              ? "ゲームで多い安価な方法。網目模様を 2 枚ずらして流し、底に重ねるだけ。水面の波とは連動しないが、ほとんど負荷がかからない。"
              : "コースティクスがないと、プールの底は一様に照らされるだけで、水の存在感がぐっと弱くなる。"
        );
      },
    };
  },
};
