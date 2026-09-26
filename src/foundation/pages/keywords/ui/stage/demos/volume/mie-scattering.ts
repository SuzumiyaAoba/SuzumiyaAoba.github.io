import {
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  Mesh,
  Vector3,
} from "three";
import { atmosphereSky, sunlightColor } from "../../atmosphere";
import { palette, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";

const DEGREE = Math.PI / 180;

export const demo: DemoModule = {
  alt: "空気中のちり・水滴・排気ガスのような、光の波長と同じくらいの大きさの粒子による散乱（ミー散乱）のデモ。色による違いがほとんどないので白っぽく、光の進む向きに強く散乱する。粒子が多い日は、太陽の周りに明るい光の輪ができ、地平線付近が白くかすむ。",
  camera: { position: [0, 1.2, 6], target: [0, 2, -4], fov: 55 },
  studio: false,
  controls: [
    {
      type: "range",
      key: "haze",
      label: "微粒子の量（かすみ）",
      min: 0,
      max: 12,
      step: 0.1,
      value: 4,
    },
    {
      type: "range",
      key: "g",
      label: "前方散乱の強さ g",
      min: 0,
      max: 0.95,
      step: 0.01,
      value: 0.8,
    },
    {
      type: "range",
      key: "elevation",
      label: "太陽の高さ",
      min: 1,
      max: 45,
      step: 0.5,
      value: 12,
      format: (value) => `${value}°`,
    },
    {
      type: "toggle",
      key: "rayleigh",
      label: "レイリー散乱（青空）も含める",
      value: true,
    },
  ],
  legend: [
    { color: palette.ink, label: "ミー散乱：色によらず白く、前方に強い" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(6);
    const sky = atmosphereSky(context);
    const sunLight = new DirectionalLight("#ffffff", 2.5);
    const skyLight = new HemisphereLight("#9ab4e0", "#1d1d18", 0.5);
    scene.add(sunLight, skyLight);
    const ground = new Mesh(
      new CircleGeometry(60, 64),
      standard("#2e3a2c", { roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    // 遠くまで並ぶ木（かすみで遠くほど白く見える）
    const trunk = standard("#2a2118", { roughness: 1 });
    const leaves = standard("#1f3524", { roughness: 1 });
    for (let index = 0; index < 40; index++) {
      const distance = 3 + random() * 40;
      const angle = (random() - 0.5) * 1.6;
      const x = Math.sin(angle) * distance;
      const z = -Math.cos(angle) * distance;
      const scale = 0.8 + random() * 0.8;
      const stem = new Mesh(new CylinderGeometry(0.06, 0.08, 0.8, 8), trunk);
      stem.position.set(x, 0.4 * scale, z);
      stem.scale.setScalar(scale);
      const crown = new Mesh(new ConeGeometry(0.5, 1.6, 12), leaves);
      crown.position.set(x, (0.8 + 0.8) * scale, z);
      crown.scale.setScalar(scale);
      scene.add(stem, crown);
    }
    const sun = new Vector3();
    const color = new Color();
    const fog = new FogExp2("#a8b8c8", 0.01);
    const clearAir = new Color("#6f8fb8");
    const hazeColor = new Color("#d8d4cc");
    const previousFog = scene.fog;
    scene.fog = fog;

    return {
      update() {
        const haze = Number(params["haze"]);
        const elevation = Number(params["elevation"]) * DEGREE;
        const rayleigh = params["rayleigh"] === true ? 1 : 0;
        sun.set(0.15, Math.sin(elevation), -Math.cos(elevation)).normalize();
        sky.uniforms.uSun.value.copy(sun);
        sky.uniforms.uMieScale.value = haze;
        sky.uniforms.uRayleighScale.value = rayleigh;
        sky.uniforms.uG.value = Number(params["g"]);
        sunlightColor(sun, rayleigh, haze, color);
        sunLight.color.copy(color);
        sunLight.position.copy(sun).multiplyScalar(10);
        // 遠景ほど、かすみの色に近づける（簡易的な空気遠近）
        const fogDensity = 0.004 + haze * 0.004;
        fog.density = fogDensity;
        fog.color
          .copy(clearAir)
          .lerp(hazeColor, Math.min(1, haze / 8))
          .multiply(color)
          .multiplyScalar(1.1);
        context.readout(
          "微粒子の量",
          `レイリーの ${(haze * 0.34).toFixed(1)} 倍相当`
        );
        context.readout(
          "かすみ具合",
          fogDensity > 0.03
            ? "濃い"
            : fogDensity > 0.015
              ? "中程度"
              : "澄んでいる"
        );
        context.caption(
          haze < 0.5
            ? "微粒子が少ないと、空気の分子によるレイリー散乱だけになり、空は深い青で太陽の周りもすっきりしている。"
            : "ちりや水滴による散乱は色をほとんど選ばないので白っぽく、光の進む向きに集中する。太陽の近くほど明るい光の輪になり、地平線が白くかすむ。"
        );
      },
      dispose() {
        scene.fog = previousFog;
      },
    };
  },
};
