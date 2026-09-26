import { Mesh, RingGeometry, Vector3 } from "three";
import { arrowheadGeometry, limit } from "../../agents";
import { arrow, marker, palette, rng, standard, trail } from "../../kit";
import type { DemoModule } from "../../types";

const HEIGHT = 0.2;

type Agent = {
  arrival: boolean;
  position: Vector3;
  velocity: Vector3;
  mesh: Mesh;
  line: ReturnType<typeof trail>;
  desired: ReturnType<typeof arrow>;
  steering: ReturnType<typeof arrow>;
};

export const demo: DemoModule = {
  alt: "同じ目標へ向かう 2 体のエージェント。シークだけの赤い方は全速力のまま目標を通り過ぎて周りをぐるぐる回り、アライバルの水色の方は減速円に入ると速度を落として目標でぴたりと止まる。",
  camera: { position: [0, 9, 7.5], target: [0, 0, 0.4] },
  controls: [
    {
      type: "range",
      key: "radius",
      label: "減速を始める距離（アライバル）",
      min: 0.3,
      max: 4,
      step: 0.1,
      value: 2,
      format: (value) => `${value.toFixed(1)} m`,
    },
    {
      type: "range",
      key: "maxSpeed",
      label: "最高速度",
      min: 1,
      max: 8,
      step: 0.1,
      value: 4.5,
    },
    {
      type: "range",
      key: "maxForce",
      label: "最大操舵力（曲がる力）",
      min: 1,
      max: 20,
      step: 0.5,
      value: 7,
    },
    {
      type: "toggle",
      key: "vectors",
      label: "希望速度と操舵ベクトル",
      value: true,
    },
    { type: "toggle", key: "auto", label: "目標を自動で動かす", value: true },
  ],
  legend: [
    { color: palette.coral, label: "シーク（奥の列）" },
    { color: palette.cyan, label: "シーク＋アライバル（手前の列）" },
    { color: palette.ink, label: "希望速度（白）" },
    { color: palette.amber, label: "操舵力（黄）" },
  ],
  hint: "床をクリック（タップ）して目標を置けます。",
  setup(context) {
    const { scene, params } = context;
    const random = rng(8);
    const target = new Vector3(2.5, HEIGHT, -1);
    const LANE = 1.4;
    const flag = marker(palette.cyan, 0.14);
    const seekFlag = marker(palette.coral, 0.14);
    scene.add(seekFlag);
    const ring = new Mesh(
      new RingGeometry(0.97, 1, 64),
      standard(palette.cyan, { emissive: 0.8 })
    );
    ring.rotation.x = -Math.PI / 2;
    scene.add(flag, ring);
    const geometry = arrowheadGeometry(0.6, 0.24);
    const agents: Agent[] = [false, true].map((arrival) => {
      const color = arrival ? palette.cyan : palette.coral;
      const mesh = new Mesh(
        geometry,
        standard(color, { roughness: 0.4, emissive: 0.25 })
      );
      mesh.castShadow = true;
      const line = trail(70, color, { width: 2.2 });
      const desired = arrow(palette.ink, { radius: 0.018 });
      const steering = arrow(palette.amber, { radius: 0.022 });
      scene.add(mesh, line, desired, steering);
      return {
        arrival,
        position: new Vector3(arrival ? -3 : -3.5, HEIGHT, arrival ? 1.5 : 0.5),
        velocity: new Vector3(),
        mesh,
        line,
        desired,
        steering,
      };
    });
    let timer = 0;
    context.onPick((point) => {
      context.setParam("auto", false);
      target.set(point.x, HEIGHT, point.z);
    });
    const desired = new Vector3();
    const steer = new Vector3();

    return {
      update({ dt }) {
        const radius = Number(params["radius"]);
        const maxSpeed = Number(params["maxSpeed"]);
        const maxForce = Number(params["maxForce"]);
        timer += dt;
        if (params["auto"] === true && timer > 4) {
          timer = 0;
          target.set((random() - 0.5) * 9, HEIGHT, (random() - 0.5) * 3.4);
        }
        flag.position.copy(target).setZ(target.z + LANE);
        seekFlag.position.copy(target).setZ(target.z - LANE);
        ring.position.set(target.x, 0.01, target.z + LANE);
        ring.scale.setScalar(radius);
        const showVectors = params["vectors"] === true;
        for (const agent of agents) {
          const goal = target
            .clone()
            .setZ(target.z + (agent.arrival ? LANE : -LANE));
          desired.copy(goal).sub(agent.position).setY(0);
          const distance = desired.length();
          const speed =
            agent.arrival && distance < radius
              ? maxSpeed * (distance / radius)
              : maxSpeed;
          desired.setLength(distance > 1e-4 ? speed : 0);
          steer.copy(desired).sub(agent.velocity);
          limit(steer, maxForce);
          agent.velocity.addScaledVector(steer, dt);
          limit(agent.velocity, maxSpeed);
          agent.position.addScaledVector(agent.velocity, dt);
          agent.mesh.position.copy(agent.position);
          if (agent.velocity.lengthSq() > 1e-4) {
            agent.mesh.lookAt(agent.position.clone().add(agent.velocity));
          }
          agent.line.push(agent.position);
          agent.desired.visible = showVectors;
          agent.steering.visible = showVectors;
          if (showVectors) {
            agent.desired.set(
              agent.position.clone().setY(0.45),
              desired.clone().multiplyScalar(0.35)
            );
            agent.steering.set(
              agent.position.clone().setY(0.45),
              steer.clone().multiplyScalar(0.12)
            );
          }
        }
        const [seeker, arriver] = agents;
        if (seeker && arriver) {
          context.readout(
            "シークの速さ",
            `${seeker.velocity.length().toFixed(2)} m/s`
          );
          context.readout(
            "アライバルの速さ",
            `${arriver.velocity.length().toFixed(2)} m/s`
          );
          context.readout(
            "アライバルの残り距離",
            `${arriver.position.distanceTo(flag.position).toFixed(2)} m`
          );
        }
        context.caption(
          "操舵力 = 希望速度 − 現在の速度。シークは常に全速の希望速度を出すので止まれない。アライバルは減速円の中で希望速度を距離に比例して小さくする。"
        );
      },
    };
  },
};
