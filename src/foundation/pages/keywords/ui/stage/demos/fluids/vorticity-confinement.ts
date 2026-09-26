import { BoxGeometry, Color, Mesh, PlaneGeometry, ShaderMaterial } from "three";
import { palette, standard } from "../../kit";
import { fluidDisplayFragment, gpuFluid } from "../../fluid2d";
import type { DemoModule } from "../../types";

const WIDTH = 3.3;
const HEIGHT = 4.2;
const ASPECT = WIDTH / HEIGHT;

export const demo: DemoModule = {
  alt: "同じ煙を、渦度閉じ込めなし（左）とあり（右）で比べるデモ。格子で流体を計算すると、細かな渦は計算の誤差でならされて消えてしまい、煙がのっぺりと立ちのぼる。右では、渦がある所で回転をさらに強める力を足すので、同じ粗い格子でも、煙が細かく巻きながら立ちのぼる。",
  camera: { position: [0, 2.35, 7.3], target: [0, 2.35, 0], orbit: false },
  studio: { floor: false, background: "#07090d" },
  controls: [
    {
      type: "range",
      key: "strength",
      label: "渦度閉じ込めの強さ（右）",
      min: 0,
      max: 60,
      step: 1,
      value: 30,
    },
    {
      type: "select",
      key: "view",
      label: "表示",
      value: "dye",
      options: [
        { value: "dye", label: "煙" },
        { value: "curl", label: "渦の回転" },
      ],
    },
    { type: "button", key: "clear", label: "消す" },
  ],
  legend: [
    { color: palette.coral, label: "時計回りの渦" },
    { color: palette.sky, label: "反時計回りの渦" },
  ],
  setup(context) {
    const { scene, params } = context;
    const tanks = [-1, 1].map((side) => {
      const fluid = gpuFluid(context, {
        simWidth: 96,
        dyeWidth: 384,
        aspect: ASPECT,
      });
      const uniforms = {
        uDye: { value: fluid.textures.dye },
        uVelocity: { value: fluid.textures.velocity },
        uPressure: { value: fluid.textures.pressure },
        uCurl: { value: fluid.textures.curl },
        uMode: { value: 0 },
      };
      const material = context.track(
        new ShaderMaterial({
          uniforms,
          vertexShader:
            "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
          fragmentShader: fluidDisplayFragment,
        })
      );
      const screen = new Mesh(new PlaneGeometry(WIDTH, HEIGHT), material);
      screen.position.set(side * (WIDTH / 2 + 0.12), 2.2, 0);
      const frame = new Mesh(
        new BoxGeometry(WIDTH + 0.14, HEIGHT + 0.14, 0.1),
        standard("#2a2f3a", { metalness: 0.6, roughness: 0.4 })
      );
      frame.position.copy(screen.position).setZ(-0.08);
      const label = context.label(
        side < 0 ? "渦度閉じ込めなし" : "渦度閉じ込めあり",
        { tone: "strong" }
      );
      label.position.set(screen.position.x, 2.2 + HEIGHT / 2 + 0.25, 0);
      scene.add(screen, frame, label);
      return { fluid, uniforms, side };
    });

    let time = 0;
    const smoke = new Color(1.5, 0.9, 0.5);
    return {
      action(key) {
        if (key === "clear") {
          for (const tank of tanks) {
            tank.fluid.clear();
          }
        }
      },
      update({ dt }) {
        const showCurl = params["view"] === "curl";
        if (dt > 0) {
          time += dt;
          const h = Math.min(dt, 1 / 30);
          for (const tank of tanks) {
            // 両方の水槽に、まったく同じ煙と揺れを与える
            const sway = Math.sin(time * 0.9) * 90 + Math.sin(time * 2.3) * 40;
            tank.fluid.splat(
              0.5,
              0.05,
              sway,
              380,
              smoke.clone().multiplyScalar(h * 4),
              0.0012
            );
            tank.fluid.step({
              dt: h,
              pressureIterations: 25,
              vorticity: tank.side > 0 ? Number(params["strength"]) : 0,
              velocityDissipation: 0.1,
              dyeDissipation: 0.8,
            });
            if (showCurl) {
              tank.fluid.computeCurl();
            }
          }
        }
        for (const tank of tanks) {
          tank.uniforms.uMode.value = showCurl ? 3 : 0;
          tank.uniforms.uDye.value = tank.fluid.textures.dye;
          tank.uniforms.uVelocity.value = tank.fluid.textures.velocity;
          tank.uniforms.uCurl.value = tank.fluid.textures.curl;
        }
        context.readout("格子", "96×122（あえて粗く）");
        context.caption(
          "渦の強さ（回転の速さ）が大きい所へ向かう向きを求め、それと直角の向きに、回転を強める小さな力を足す。数値計算でならされて消えるはずだった細かい渦がよみがえり、同じ粗い格子でも煙が巻き上がって見える。"
        );
      },
    };
  },
};
