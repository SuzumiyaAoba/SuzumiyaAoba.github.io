import {
  BackSide,
  BoxGeometry,
  Color,
  Light,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusKnotGeometry,
} from "three";
import type { Texture } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { palette } from "../../kit";
import type { DemoModule } from "../../types";

const ROUGHNESS = [0, 0.15, 0.35, 0.6, 0.9] as const;

/** 夕暮れ：空のグラデーションと太陽。 */
function sunsetScene() {
  const scene = new Scene();
  const sky = new Mesh(
    new SphereGeometry(10, 64, 32),
    new ShaderMaterial({
      side: BackSide,
      vertexShader: /* glsl */ `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vDirection;
        void main() {
          float y = vDirection.y;
          vec3 top = vec3(0.12, 0.2, 0.55);
          vec3 horizon = vec3(1.6, 0.7, 0.35);
          vec3 ground = vec3(0.08, 0.06, 0.07);
          vec3 color = y > 0.0 ? mix(horizon, top, pow(y, 0.5)) : mix(horizon * 0.3, ground, min(-y * 4.0, 1.0));
          float sun = pow(max(dot(vDirection, normalize(vec3(0.8, 0.12, -0.6))), 0.0), 600.0);
          color += vec3(40.0, 26.0, 12.0) * sun;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
  );
  scene.add(sky);
  return scene;
}

/** ネオンの夜：暗い部屋に色の付いた発光パネル。 */
function neonScene() {
  const scene = new Scene();
  scene.background = new Color("#020308");
  const panels = [
    { color: "#ff3fa4", at: [-4, 1.5, -3], size: [0.4, 4, 3] },
    { color: "#28e0ff", at: [4, 1, -2], size: [0.4, 3, 4] },
    { color: "#ffb13b", at: [0, 4.5, 0], size: [5, 0.3, 1] },
    { color: "#6f5cff", at: [0, 0.5, 5], size: [6, 1.2, 0.3] },
  ] as const;
  for (const { color, at, size } of panels) {
    const panel = new Mesh(
      new BoxGeometry(size[0], size[1], size[2]),
      new MeshBasicMaterial({ color: new Color(color).multiplyScalar(6) })
    );
    panel.position.set(at[0], at[1], at[2]);
    scene.add(panel);
  }
  return scene;
}

export const demo: DemoModule = {
  alt: "ライトを 1 つも置かず、周囲の景色の画像（環境マップ）だけで物体を照らす環境マップ照明のデモ。スタジオ・夕暮れ・ネオンの夜を切り替えると、同じ金属の球や像が、その場の景色を映し込んで一瞬でなじむ。粗い球ほど、ぼかした環境マップを使うので映り込みがにじむ。",
  camera: { position: [0, 1.8, 6.6], target: [0, 0.9, 0] },
  controls: [
    {
      type: "select",
      key: "environment",
      label: "環境",
      value: "sunset",
      options: [
        { value: "studio", label: "スタジオ" },
        { value: "sunset", label: "夕暮れ" },
        { value: "neon", label: "ネオンの夜" },
      ],
    },
    { type: "toggle", key: "rotate", label: "環境を回す", value: true },
    {
      type: "range",
      key: "intensity",
      label: "環境光の強さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 1,
    },
    {
      type: "toggle",
      key: "direct",
      label: "直接光（ステージの照明）も使う",
      value: false,
    },
  ],
  legend: [{ color: palette.muted, label: "照明は環境マップのみ" }],
  setup(context) {
    const { scene, params, renderer } = context;
    const pmrem = new PMREMGenerator(renderer);
    const environments: Record<string, Texture> = {
      studio: context.track(
        pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      ),
      sunset: context.track(pmrem.fromScene(sunsetScene(), 0.02).texture),
      neon: context.track(pmrem.fromScene(neonScene(), 0.02).texture),
    };
    pmrem.dispose();
    const previous = {
      environment: scene.environment,
      background: scene.background,
      intensity: scene.environmentIntensity,
      fog: scene.fog,
    };
    scene.fog = null;
    const lights = scene.children.filter(
      (child): child is Light => child instanceof Light
    );

    const sphere = new SphereGeometry(0.36, 64, 32);
    for (const [row, metal] of [true, false].entries()) {
      for (const [column, roughness] of ROUGHNESS.entries()) {
        const mesh = new Mesh(
          sphere,
          new MeshStandardMaterial({
            color: metal ? "#f2f2f2" : "#e8e4dc",
            metalness: metal ? 1 : 0,
            roughness,
          })
        );
        mesh.position.set(-1.9 + column * 0.95, 0.36, row === 0 ? 1.1 : 0.05);
        scene.add(mesh);
      }
    }
    const statue = new Mesh(
      new TorusKnotGeometry(0.5, 0.17, 256, 32),
      new MeshStandardMaterial({
        color: "#e8b86a",
        metalness: 1,
        roughness: 0.2,
      })
    );
    statue.position.set(0, 1.55, -1.3);
    scene.add(statue);
    const labels = [
      { text: "金属", at: [-2.75, 0.36, 1.1] },
      { text: "非金属", at: [-2.75, 0.36, 0.05] },
      { text: "粗さ 0 → 0.9", at: [0, 0.95, 1.1] },
    ] as const;
    for (const { text, at } of labels) {
      const label = context.label(text, { tone: "muted" });
      label.position.set(at[0], at[1], at[2]);
      scene.add(label);
    }
    let angle = 0;

    return {
      update({ dt }) {
        if (params["rotate"] === true) {
          angle += dt * 0.25;
        }
        const environment =
          environments[String(params["environment"])] ??
          environments["studio"] ??
          null;
        scene.environment = environment;
        scene.background = environment;
        scene.backgroundBlurriness = 0.12;
        scene.backgroundIntensity = 0.4;
        scene.environmentIntensity = Number(params["intensity"]);
        scene.environmentRotation.y = angle;
        scene.backgroundRotation.y = angle;
        const direct = params["direct"] === true;
        for (const light of lights) {
          light.visible = direct;
        }
        statue.rotation.y = angle * 0.6;
        context.readout(
          "光源",
          direct ? "環境マップ + 直接光" : "環境マップのみ"
        );
        context.caption(
          "周囲の景色を全方向の画像として持ち、あらゆる方向からの光として使う。粗い面では、あらかじめぼかしておいた画像を読むので、映り込みが柔らかくにじむ。"
        );
      },
      dispose() {
        scene.environment = previous.environment;
        scene.background = previous.background;
        scene.environmentIntensity = previous.intensity;
        scene.fog = previous.fog;
        scene.backgroundBlurriness = 0;
        scene.backgroundIntensity = 1;
        scene.environmentRotation.set(0, 0, 0);
        scene.backgroundRotation.set(0, 0, 0);
        for (const light of lights) {
          light.visible = true;
        }
      },
    };
  },
};
