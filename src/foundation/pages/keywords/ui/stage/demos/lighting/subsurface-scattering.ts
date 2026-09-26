import {
  AdditiveBlending,
  Color,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { glowSprite, palette } from "../../kit";
import { glslSdf, raymarchWorld } from "../../raymarch";
import type { DemoModule } from "../../types";

const FLAME = new Vector3(1.25, 1.62, 0);

const presets = {
  wax: {
    albedo: [0.93, 0.86, 0.72],
    scatter: [1, 0.62, 0.3],
    sigma: [1.6, 2.8, 5],
    label: "蝋",
  },
  skin: {
    albedo: [0.85, 0.6, 0.5],
    scatter: [1, 0.28, 0.16],
    sigma: [1.4, 5.5, 8],
    label: "肌",
  },
  jade: {
    albedo: [0.45, 0.72, 0.55],
    scatter: [0.35, 1, 0.55],
    sigma: [5, 1.6, 3.4],
    label: "翡翠",
  },
} as const;
type PresetKey = keyof typeof presets;
const isPreset = (value: unknown): value is PresetKey =>
  typeof value === "string" && Object.hasOwn(presets, value);

const modes = { none: 0, wrap: 1, transmit: 2, both: 3 } as const;
type Mode = keyof typeof modes;
const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && Object.hasOwn(modes, value);

export const demo: DemoModule = {
  alt: "光が物体の内部に入り込んで散らばってから出てくる表面下散乱のデモ。うさぎの置物の耳のような薄い部分は、後ろから光が当たると内側から赤く透けて光り、厚い胴体はほとんど透けない。ろうそくは炎の光が蝋の中を通って上のほうがぼんやり光る。物体の中を光の方向へたどって厚みを測り、厚いほど光を弱めている。",
  camera: { position: [0.2, 1.7, 5.4], target: [0.1, 0.9, 0] },
  studio: { floor: false, background: "#06080d" },
  bloom: { strength: 0.8, radius: 0.5, threshold: 0.7 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "表現",
      value: "both",
      options: [
        { value: "none", label: "表面の反射のみ" },
        { value: "wrap", label: "ラップ照明" },
        { value: "transmit", label: "厚みで透過" },
        { value: "both", label: "両方" },
      ],
    },
    {
      type: "select",
      key: "preset",
      label: "うさぎの素材",
      value: "skin",
      options: [
        { value: "skin", label: "肌" },
        { value: "wax", label: "蝋" },
        { value: "jade", label: "翡翠" },
      ],
    },
    { type: "toggle", key: "orbit", label: "後ろの光を動かす", value: true },
    {
      type: "range",
      key: "density",
      label: "内部の濃さ",
      min: 0.3,
      max: 3,
      step: 0.05,
      value: 1,
      hint: "大きいほど光が内部で弱まり、薄い部分しか透けなくなります。",
    },
  ],
  legend: [{ color: palette.amber, label: "後ろからの光" }],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uBackLight: { value: new Vector3(-1, 1.4, -1.6) },
      uFlame: { value: FLAME.clone() },
      uMode: { value: 3 },
      uDensity: { value: 1 },
      uAlbedo: { value: new Vector3() },
      uScatter: { value: new Vector3() },
      uSigma: { value: new Vector3() },
    };
    raymarchWorld(context, {
      uniforms,
      emission: true,
      stepScale: 0.85,
      steps: 160,
      functions: /* glsl */ `
        ${glslSdf}
        float sdEllipsoid(vec3 p, vec3 r) {
          float k0 = length(p / r);
          float k1 = length(p / (r * r));
          return k0 * (k0 - 1.0) / k1;
        }
        // id: 0 = うさぎ, 1 = ろうそく, 2 = 芯
        float scene(vec3 p, out float id) {
          vec3 b = p - vec3(-0.95, 0.0, 0.0);
          float body = sdEllipsoid(b - vec3(0.0, 0.55, 0.0), vec3(0.55, 0.52, 0.48));
          float head = sdSphere(b - vec3(0.05, 1.18, 0.05), 0.33);
          vec3 e = b - vec3(0.0, 1.45, 0.0);
          e.x = abs(e.x) - 0.16;
          e.xy = rot2(-0.34) * e.xy;
          float ear = sdEllipsoid(e - vec3(0.0, 0.33, 0.0), vec3(0.09, 0.38, 0.035));
          float bunny = smin(smin(body, head, 0.22), ear, 0.08);
          vec3 c = p - vec3(${FLAME.x.toFixed(2)}, 0.0, 0.0);
          float candle = sdCappedCylinder(c - vec3(0.0, 0.7, 0.0), 0.7, 0.34) - 0.02;
          candle = smax(candle, -sdSphere(c - vec3(0.0, 1.62, 0.0), 0.3), 0.06);
          float wick = sdCapsule(c, vec3(0.0, 1.35, 0.0), vec3(0.0, 1.5, 0.0), 0.018);
          float d = min(bunny, min(candle, wick));
          id = d == bunny ? 0.0 : d == candle ? 1.0 : 2.0;
          return d;
        }
        float map(vec3 p) { float id; return scene(p, id); }
        vec4 surface(vec3 p, vec3 n) {
          float id;
          scene(p, id);
          if (id < 0.5) return vec4(uAlbedo, 0.45);
          if (id < 1.5) return vec4(0.93, 0.86, 0.72, 0.5);
          return vec4(0.05, 0.04, 0.03, 0.9);
        }
        // 光の方向へ物体の内部をたどり、外に出るまでの長さ（厚み）を測る
        float thickness(vec3 p, vec3 dir) {
          float t = 0.02;
          for (int i = 0; i < 28; i++) {
            float d = map(p + dir * t);
            if (d > 0.0) break;
            t += max(-d, 0.015);
          }
          return t;
        }
        vec3 subsurface(vec3 p, vec3 n, vec3 lightPos, vec3 lightColor, vec3 scatter, vec3 sigma) {
          vec3 toLight = lightPos - p;
          float distance = length(toLight);
          vec3 l = toLight / distance;
          float attenuation = 1.0 / (1.0 + distance * distance * 0.35);
          vec3 v = normalize(cameraPosition - p);
          vec3 result = vec3(0.0);
          if (uMode > 0.5 && uMode != 2.0) {
            // ラップ照明：影の境目を回り込ませ、そこに散乱の色を足す
            float wrap = max((dot(n, l) + 0.5) / 1.5, 0.0) - max(dot(n, l), 0.0);
            result += scatter * wrap * 0.35 * lightColor * attenuation;
          }
          if (uMode > 1.5) {
            // 透過：光の方向の厚みで減衰させる。光源の向こう側から見たときに最も強い
            float th = thickness(p - n * 0.01, l);
            vec3 transmit = exp(-sigma * uDensity * th * 4.0);
            float forward = pow(max(dot(-v, l), 0.0), 2.0) * 0.8 + 0.2;
            result += scatter * transmit * forward * lightColor * attenuation * 2.2;
          }
          return result;
        }
        vec3 emission(vec3 p, vec3 n) {
          float id;
          scene(p, id);
          if (id > 1.5) return vec3(0.0);
          vec3 scatter = id < 0.5 ? uScatter : vec3(1.0, 0.62, 0.3);
          vec3 sigma = id < 0.5 ? uSigma : vec3(1.6, 2.8, 5.0);
          vec3 color = subsurface(p, n, uBackLight, vec3(1.0, 0.85, 0.65) * 3.0, scatter, sigma);
          color += subsurface(p, n, uFlame, vec3(1.0, 0.6, 0.25) * 2.0, scatter, sigma);
          return pow(color, vec3(1.0 / 2.2));
        }
      `,
    });

    const makeGlow = (color: string, scale: number) => {
      const sprite = new Sprite(
        new SpriteMaterial({
          map: glowSprite(),
          color: new Color(color).multiplyScalar(2.5),
          blending: AdditiveBlending,
          depthWrite: false,
          transparent: true,
        })
      );
      sprite.scale.setScalar(scale);
      scene.add(sprite);
      return sprite;
    };
    const backGlow = makeGlow("#ffd9a0", 0.45);
    const flame = makeGlow("#ff9a3c", 0.28);
    flame.position.copy(FLAME).setY(FLAME.y - 0.02);
    let angle = 0.3;
    let time = 0;

    return {
      update({ dt }) {
        time += dt;
        if (params["orbit"] === true) {
          angle += dt * 0.5;
        }
        const mode: Mode = isMode(params["mode"]) ? params["mode"] : "both";
        const preset =
          presets[isPreset(params["preset"]) ? params["preset"] : "skin"];
        uniforms.uMode.value = modes[mode];
        uniforms.uDensity.value = Number(params["density"]);
        uniforms.uAlbedo.value.fromArray(preset.albedo);
        uniforms.uScatter.value.fromArray(preset.scatter);
        uniforms.uSigma.value.fromArray(preset.sigma);
        uniforms.uTime.value = time;
        // うさぎの後ろを回る光
        uniforms.uBackLight.value.set(
          -0.95 + Math.sin(angle) * 1.2,
          1.35,
          -1.1 - Math.cos(angle) * 0.4
        );
        backGlow.position.copy(uniforms.uBackLight.value);
        const flicker =
          1 + Math.sin(time * 17) * 0.05 + Math.sin(time * 7.3) * 0.04;
        flame.scale.set(0.2 * flicker, 0.34 * flicker, 1);
        context.readout("うさぎの素材", preset.label);
        context.caption(
          mode === "none"
            ? "表面で反射する光だけだと、石膏やプラスチックのような硬い見た目になる。光が裏から当たっても、影側は真っ暗のまま。"
            : mode === "wrap"
              ? "ラップ照明は、影の境目の手前まで光を回り込ませ、そこに赤みを足す安価な近似。肌の柔らかさが出るが、裏からの透けは出ない。"
              : "物体の中を光源の方向へたどって厚みを測り、厚いほど光を弱めて足す。耳のように薄い部分だけが、裏からの光で赤く透ける。"
        );
      },
    };
  },
};
