import {
  BoxGeometry,
  Color,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { palette, standard } from "../../kit";
import { fluidDisplayFragment, gpuFluid } from "../../fluid2d";
import type { DemoModule } from "../../types";

const WIDTH = 7.2;
const HEIGHT = 4.2;
const ASPECT = WIDTH / HEIGHT;

export const demo: DemoModule = {
  alt: "格子の上で流体を計算する安定流体法のデモ。画面の下にある 3 つの煙突から色の付いた煙が立ちのぼり、渦を巻きながら混ざり合う。各マスは速度と煙の濃さを持ち、毎ステップ、流れに沿って運び（移流）、流れが湧き出したり吸い込まれたりしないよう速度を直す（圧力投影）。画面をドラッグすると、指でかき混ぜるように流れを起こせる。",
  camera: { position: [0, 2.2, 6.3], target: [0, 2.2, 0], orbit: false },
  studio: { floor: false, background: "#07090d" },
  controls: [
    {
      type: "select",
      key: "view",
      label: "表示",
      value: "dye",
      options: [
        { value: "dye", label: "煙" },
        { value: "velocity", label: "速度（向きを色で）" },
        { value: "pressure", label: "圧力" },
        { value: "curl", label: "渦の回転" },
      ],
    },
    {
      type: "range",
      key: "iterations",
      label: "圧力の反復回数",
      min: 0,
      max: 60,
      step: 1,
      value: 25,
      hint: "0 にすると圧力投影をしないので、流れが渦を作らず、ぼやけて広がるだけになります。",
    },
    {
      type: "range",
      key: "vorticity",
      label: "渦度閉じ込め",
      min: 0,
      max: 40,
      step: 1,
      value: 15,
    },
    {
      type: "range",
      key: "fade",
      label: "煙の消えやすさ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 0.9,
    },
    { type: "toggle", key: "emit", label: "煙突から煙を出す", value: true },
    { type: "button", key: "clear", label: "消す" },
  ],
  legend: [
    { color: palette.coral, label: "圧力が高い・時計回り" },
    { color: palette.sky, label: "圧力が低い・反時計回り" },
  ],
  hint: "画面をドラッグすると、流れをかき混ぜられます。",
  setup(context) {
    const { scene, params, pointer } = context;
    const fluid = gpuFluid(context, {
      simWidth: 224,
      dyeWidth: 640,
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
    screen.position.set(0, 2.2, 0);
    scene.add(screen);
    const frame = new Mesh(
      new BoxGeometry(WIDTH + 0.2, HEIGHT + 0.2, 0.1),
      standard("#2a2f3a", { metalness: 0.6, roughness: 0.4 })
    );
    frame.position.set(0, 2.2, -0.08);
    scene.add(frame);

    const emitters = [
      { x: 0.2, color: new Color(1.4, 0.35, 0.15) },
      { x: 0.5, color: new Color(0.2, 0.9, 1.3) },
      { x: 0.8, color: new Color(1.2, 0.3, 1.1) },
    ];
    const last = new Vector3();
    const current = new Vector3();
    let dragging = false;
    let time = 0;
    const toUv = (p: Vector3) => ({
      u: p.x / WIDTH + 0.5,
      v: (p.y - 2.2) / HEIGHT + 0.5,
    });

    return {
      action(key) {
        if (key === "clear") {
          fluid.clear();
        }
      },
      update({ dt }) {
        const views = ["dye", "velocity", "pressure", "curl"];
        const mode = views.indexOf(String(params["view"]));
        uniforms.uMode.value = Math.max(0, mode);
        if (dt > 0) {
          time += dt;
          if (params["emit"] === true) {
            for (const [index, emitter] of emitters.entries()) {
              // 煙突：少し揺らしながら上向きの流れと煙を足し続ける
              const sway = Math.sin(time * 1.3 + index * 2) * 120;
              fluid.splat(
                emitter.x,
                0.04,
                sway,
                520,
                emitter.color.clone().multiplyScalar(dt * 3.5),
                0.0009
              );
            }
          }
          // ドラッグ：動かした向きと速さの流れを起こす
          const hit = pointer.down
            ? context.pointerOnPlane(
                { normal: [0, 0, 1], origin: [0, 2.2, 0] },
                current
              )
            : null;
          if (hit) {
            if (dragging) {
              const a = toUv(last);
              const b = toUv(current);
              const dx = (b.u - a.u) * 6000;
              const dy = (b.v - a.v) * 6000;
              if (Math.hypot(dx, dy) > 1) {
                const hue = (time * 0.15) % 1;
                fluid.splat(
                  b.u,
                  b.v,
                  dx,
                  dy,
                  new Color().setHSL(hue, 0.9, 0.5).multiplyScalar(1.6),
                  0.0015
                );
              }
            }
            last.copy(current);
            dragging = true;
          } else {
            dragging = false;
          }
          const iterations = Number(params["iterations"]);
          fluid.step({
            dt: Math.min(dt, 1 / 30),
            pressureIterations: iterations,
            vorticity: Number(params["vorticity"]),
            velocityDissipation: 0.15,
            dyeDissipation: Number(params["fade"]),
            project: iterations > 0,
          });
          if (mode === 3) {
            fluid.computeCurl();
          }
        }
        uniforms.uDye.value = fluid.textures.dye;
        uniforms.uVelocity.value = fluid.textures.velocity;
        uniforms.uPressure.value = fluid.textures.pressure;
        uniforms.uCurl.value = fluid.textures.curl;
        context.readout("格子", `${fluid.simSize.x}×${fluid.simSize.y}`);
        context.caption(
          "各マスは速度と煙の濃さを持つ。毎ステップ、①速度と煙を流れに沿って運び（半ラグランジュ移流）、②煙突やドラッグの力を足し、③圧力を解いて、流れが湧き出したり消えたりしないよう速度を直す（圧力投影）。どんなに大きな時間刻みでも発散しないのが「安定」の名の由来。"
        );
      },
    };
  },
};
