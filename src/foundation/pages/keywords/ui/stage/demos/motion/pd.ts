import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  RingGeometry,
  Vector3,
} from "three";
import { palette, polyline, standard } from "../../kit";
import { hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const GRAVITY = 9.8;
const MASS = 1;
const MAX_THRUST = 30;
const HISTORY = 300;
const SUBSTEPS = 6;

function drone() {
  const group = new Group();
  const body = new Mesh(
    new BoxGeometry(0.7, 0.18, 0.7),
    standard("#2b3444", { metalness: 0.5, roughness: 0.35 })
  );
  const light = new Mesh(
    new BoxGeometry(0.3, 0.05, 0.05),
    standard(palette.cyan, { emissive: 1.5 })
  );
  light.position.set(0, 0.02, 0.36);
  group.add(body, light);
  const rotors: Mesh[] = [];
  for (const [x, z] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    const arm = new Mesh(new BoxGeometry(0.6, 0.05, 0.06), standard("#3b475a"));
    arm.position.set(x * 0.36, 0, z * 0.36);
    arm.rotation.y = x * z > 0 ? -Math.PI / 4 : Math.PI / 4;
    const rotor = new Mesh(
      new CylinderGeometry(0.28, 0.28, 0.02, 24),
      standard("#cfd6e2", { roughness: 0.3 })
    );
    rotor.material.transparent = true;
    rotor.material.opacity = 0.45;
    rotor.position.set(x * 0.55, 0.1, z * 0.55);
    group.add(arm, rotor);
    rotors.push(rotor);
  }
  group.traverse((child) => {
    child.castShadow = true;
  });
  return Object.assign(group, { rotors });
}

export const demo: DemoModule = {
  alt: "目標の高さでホバリングしようとするドローン。比例（P）だけでは振動し、微分（D）を加えると揺れが収まるが、重力のせいで目標より少し下で止まる。積分（I）を加えるとその誤差も消える。右下のグラフは高さの履歴。",
  camera: { position: [3.4, 3.2, 5.6], target: [0, 2.2, 0] },
  controls: [
    {
      type: "range",
      key: "kp",
      label: "Kp（比例）",
      min: 0,
      max: 60,
      step: 0.5,
      value: 20,
    },
    {
      type: "range",
      key: "kd",
      label: "Kd（微分）",
      min: 0,
      max: 15,
      step: 0.1,
      value: 5,
    },
    {
      type: "range",
      key: "ki",
      label: "Ki（積分）",
      min: 0,
      max: 30,
      step: 0.5,
      value: 0,
    },
    {
      type: "select",
      key: "target",
      label: "目標の高さ",
      value: "3",
      options: [
        { value: "1.5", label: "1.5 m" },
        { value: "3", label: "3 m" },
        { value: "4.2", label: "4.2 m" },
      ],
    },
    { type: "button", key: "gust", label: "下向きの突風" },
  ],
  legend: [
    { color: palette.amber, label: "目標の高さ" },
    { color: palette.cyan, label: "実際の高さ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const craft = drone();
    craft.scale.setScalar(1.3);
    scene.add(craft);
    // 高さの目盛り付きポール
    const ruler = new Mesh(
      new CylinderGeometry(0.025, 0.025, 5, 8),
      standard("#4b576b")
    );
    ruler.position.set(-1.6, 2.5, 0);
    scene.add(ruler);
    for (let meter = 1; meter <= 4; meter++) {
      const tick = new Mesh(
        new BoxGeometry(0.22, 0.02, 0.02),
        standard(palette.muted)
      );
      tick.position.set(-1.6, meter, 0);
      const label = context.label(`${meter} m`, {
        tone: "muted",
        color: palette.muted,
      });
      label.position.set(-1.95, meter, 0);
      scene.add(tick, label);
    }
    const pad = new Mesh(
      new RingGeometry(0.5, 0.7, 48),
      standard(palette.amber, { emissive: 0.4 })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.01;
    const targetLine = polyline(
      [new Vector3(-2, 3, 0), new Vector3(2, 3, 0)],
      palette.amber,
      {
        width: 2,
        dashed: true,
        dashSize: 0.15,
        gapSize: 0.1,
      }
    );
    const targetLabel = context.label("目標", { color: palette.amber });
    scene.add(pad, targetLine, targetLabel);

    const graph = hudGraph(context, {
      title: "高さ（直近 5 秒）",
      min: 0,
      max: 5,
      xLabel: "時間",
    });
    const history = Array.from({ length: HISTORY }, () => 0);
    let height = 0.1;
    let velocity = 0;
    let integral = 0;
    let previousError = 0;
    let thrust = 0;
    let gust = 0;

    return {
      action(key) {
        if (key === "gust") {
          gust = 0.35;
        }
      },
      update({ dt, time }) {
        const kp = Number(params["kp"]);
        const kd = Number(params["kd"]);
        const ki = Number(params["ki"]);
        const goal = Number(params["target"]);
        const h = dt / SUBSTEPS;
        const steps = dt > 0 ? SUBSTEPS : 0;
        for (let step = 0; step < steps; step++) {
          const error = goal - height;
          integral = Math.max(-5, Math.min(5, integral + error * h));
          const derivative = (error - previousError) / h;
          previousError = error;
          thrust = Math.max(
            0,
            Math.min(MAX_THRUST, kp * error + ki * integral + kd * derivative)
          );
          const disturbance = gust > 0 ? -35 : 0;
          const acceleration = (thrust + disturbance) / MASS - GRAVITY;
          velocity += acceleration * h;
          height += velocity * h;
          if (height < 0.1) {
            height = 0.1;
            velocity = Math.max(0, velocity);
          }
        }
        gust = Math.max(0, gust - dt);
        craft.position.set(0, height, 0);
        craft.rotation.z = Math.sin(time * 1.3) * 0.02;
        for (const [index, rotor] of craft.rotors.entries()) {
          rotor.rotation.y +=
            dt * (8 + thrust * 3) * (index % 2 === 0 ? 1 : -1);
        }
        targetLine.setPoints([
          new Vector3(-2, goal, 0),
          new Vector3(2, goal, 0),
        ]);
        targetLabel.position.set(-2.4, goal, 0);

        if (dt > 0) {
          history.shift();
          history.push(height);
          graph.setSeries([
            { fn: () => goal, color: palette.amber, dashed: true },
            {
              fn: (t) =>
                history[Math.min(HISTORY - 1, Math.floor(t * (HISTORY - 1)))] ??
                0,
              color: palette.cyan,
            },
          ]);
          graph.setMarker(1);
        }
        const error = goal - height;
        context.readout("誤差 e", `${error.toFixed(3)} m`);
        context.readout(
          "推力",
          `${thrust.toFixed(1)} N（重力 ${(MASS * GRAVITY).toFixed(1)} N）`
        );
        context.readout("積分項 Ki·∫e", (ki * integral).toFixed(2));
        context.caption(
          kd === 0
            ? "P だけ：誤差に比例した力は『ばね』と同じ。減速する力がないので上下に揺れ続ける。"
            : ki === 0
              ? `P + D：揺れは収まるが、重力を支える推力を誤差から作るため、目標の約 ${((MASS * GRAVITY) / Math.max(kp, 0.1)).toFixed(2)} m 下で釣り合ってしまう。`
              : "P + I + D：誤差を積み上げた I 項が重力分の推力を肩代わりし、定常誤差が 0 に近づく。"
        );
      },
    };
  },
};
