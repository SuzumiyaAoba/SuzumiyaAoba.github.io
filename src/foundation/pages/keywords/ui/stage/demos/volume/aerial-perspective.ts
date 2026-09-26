import {
  BackSide,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { fbm2, palette } from "../../kit";
import type { DemoModule } from "../../types";

const RIDGES = 7;

const times = {
  day: {
    zenith: [0.22, 0.42, 0.78],
    horizon: [0.72, 0.82, 0.92],
    sun: [1, 0.95, 0.85],
    sunDirection: [0.5, 0.6, 0.55],
  },
  dusk: {
    zenith: [0.16, 0.2, 0.42],
    horizon: [0.98, 0.62, 0.38],
    sun: [1, 0.55, 0.25],
    sunDirection: [0.1, 0.08, -1],
  },
} as const;
type TimeKey = keyof typeof times;
const isTime = (value: unknown): value is TimeKey =>
  typeof value === "string" && Object.hasOwn(times, value);

/** 視線方向の空の色（空のドームと、遠景に混ぜる空気の色で共有する）。 */
const skyGlsl = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uSunDirection;
  vec3 skyColor(vec3 dir) {
    float up = clamp(dir.y, 0.0, 1.0);
    vec3 color = mix(uHorizon, uZenith, pow(up, 0.45));
    float toward = max(dot(dir, normalize(uSunDirection)), 0.0);
    color += uSunColor * (pow(toward, 8.0) * 0.35 + pow(toward, 400.0) * 6.0);
    return color;
  }
`;

export const demo: DemoModule = {
  alt: "奥へ向かって重なる山並みで、遠くの景色ほど空気の色に近づいていく空気遠近法のデモ。視線が空気の中を長く通るほど、景色の光は弱まり、代わりに空気が散乱した空の光が加わる。青い光ほど強く散乱するので、遠くの山は青くかすむ。オフにすると、遠くの山まで同じ濃さに見えて奥行きが分からなくなる。",
  camera: { position: [0, 4.5, 10], target: [0, 6, -30], fov: 50 },
  studio: false,
  controls: [
    { type: "toggle", key: "enabled", label: "空気遠近法", value: true },
    {
      type: "range",
      key: "density",
      label: "空気の濃さ",
      min: 0.002,
      max: 0.06,
      step: 0.001,
      value: 0.013,
    },
    {
      type: "toggle",
      key: "chromatic",
      label: "色ごとに散乱を変える（遠くが青くなる）",
      value: true,
    },
    {
      type: "select",
      key: "time",
      label: "時間帯",
      value: "day",
      options: [
        { value: "day", label: "昼" },
        { value: "dusk", label: "夕方" },
      ],
    },
  ],
  legend: [{ color: palette.sky, label: "遠景ほど空の色に近づく" }],
  setup(context) {
    const { scene, params } = context;
    const sky = {
      uZenith: { value: new Vector3() },
      uHorizon: { value: new Vector3() },
      uSunColor: { value: new Vector3() },
      uSunDirection: { value: new Vector3() },
    };
    const aerial = {
      uEnabled: { value: 1 },
      uDensity: { value: 0.013 },
      uChromatic: { value: 1 },
    };
    const dome = new Mesh(
      new SphereGeometry(170, 48, 24),
      new ShaderMaterial({
        uniforms: sky,
        side: BackSide,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vDirection;
          void main() {
            vDirection = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          ${skyGlsl}
          varying vec3 vDirection;
          void main() {
            gl_FragColor = vec4(skyColor(normalize(vDirection)), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    dome.renderOrder = -10;
    scene.add(dome);
    const sunLight = new DirectionalLight("#fff2dc", 3.2);
    const skyLight = new HemisphereLight("#9cb8e8", "#3a4a2a", 0.45);
    scene.add(sunLight, skyLight);

    // 奥へ重なる山並み
    for (let index = 0; index < RIDGES; index++) {
      const distance = 2 + index ** 1.6 * 7.5;
      const width = 60 + distance * 2.4;
      const height = 2.5 + index * 3.2;
      const geometry = new PlaneGeometry(width, 40, 160, 1);
      const position = geometry.getAttribute("position");
      for (let vertex = 0; vertex < position.count; vertex++) {
        const x = position.getX(vertex);
        const top = position.getY(vertex) > 0;
        const ridge =
          (0.55 +
            0.45 *
              fbm2(
                x * (0.05 / (1 + index * 0.3)) + index * 13.7,
                index * 3.1,
                5
              )) *
          height;
        position.setY(vertex, top ? ridge : -20);
      }
      geometry.computeVertexNormals();
      const tone = 0.34 - index * 0.015;
      const material = new MeshStandardMaterial({
        color: `rgb(${Math.round(tone * 255 * 0.62)}, ${Math.round(tone * 255 * 0.95)}, ${Math.round(tone * 255 * 0.5)})`,
        roughness: 1,
      });
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, sky, aerial);
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vAerialWorld;"
          )
          .replace(
            "#include <worldpos_vertex>",
            "#include <worldpos_vertex>\nvAerialWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;"
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
            ${skyGlsl}
            uniform float uEnabled;
            uniform float uDensity;
            uniform float uChromatic;
            varying vec3 vAerialWorld;`
          )
          .replace(
            "#include <tonemapping_fragment>",
            `if (uEnabled > 0.5) {
              vec3 toPoint = vAerialWorld - cameraPosition;
              float distance = length(toPoint);
              // 青ほど強く散乱・減衰させる（色によらない場合は全色同じ）
              vec3 sigma = uDensity * mix(vec3(1.0), vec3(0.55, 0.85, 1.5), uChromatic);
              vec3 transmittance = exp(-sigma * distance);
              vec3 inscatter = skyColor(normalize(normalize(toPoint) * vec3(1.0, 0.0, 1.0) + vec3(0.0, 0.04, 0.0)));
              gl_FragColor.rgb = gl_FragColor.rgb * transmittance + inscatter * (1.0 - transmittance);
            }
            #include <tonemapping_fragment>`
          );
      };
      material.customProgramCacheKey = () => "aerial-perspective";
      const ridge = new Mesh(geometry, material);
      ridge.position.set(index % 2 === 0 ? -8 : 8, 0, -distance);
      scene.add(ridge);
    }

    return {
      update() {
        const time: TimeKey = isTime(params["time"]) ? params["time"] : "day";
        const preset = times[time];
        sky.uZenith.value.fromArray(preset.zenith);
        sky.uHorizon.value.fromArray(preset.horizon);
        sky.uSunColor.value.fromArray(preset.sun);
        sky.uSunDirection.value.fromArray(preset.sunDirection).normalize();
        sunLight.position.copy(sky.uSunDirection.value).multiplyScalar(50);
        sunLight.color.fromArray(preset.sun);
        aerial.uEnabled.value = params["enabled"] === true ? 1 : 0;
        aerial.uDensity.value = Number(params["density"]);
        aerial.uChromatic.value = params["chromatic"] === true ? 1 : 0;
        const farthest = 2 + (RIDGES - 1) ** 1.6 * 7.5;
        const remaining = Math.exp(-aerial.uDensity.value * farthest);
        context.readout("いちばん奥の山", `${Math.round(farthest)} m`);
        context.readout(
          "その山の光が届く割合",
          `${Math.round(remaining * 100)}%`
        );
        context.caption(
          params["enabled"] === true
            ? "遠くの景色から届く光は、途中の空気で散らされて弱まり、代わりに空気が散乱した空の光が加わる。奥の山ほど空の色に溶け込み、手前と奥の距離感が生まれる。"
            : "空気遠近法がないと、奥の山まで手前と同じ濃さで描かれ、どれが近くてどれが遠いのか分かりにくい。"
        );
      },
    };
  },
};
