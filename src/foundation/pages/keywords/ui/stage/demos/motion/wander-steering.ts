import { Mesh, RingGeometry, Vector3 } from "three";
import { arrowheadGeometry, crowd, limit } from "../../agents";
import {
  marker,
  palette,
  polyline,
  rng,
  standard,
  TAU,
  trail,
} from "../../kit";
import type { DemoModule } from "../../types";

const COUNT = 36;
const ARENA = 4.6;
const HEIGHT = 0.12;
const SPEED = 1.6;

export const demo: DemoModule = {
  alt: "囲いの中を歩き回る虫の群れ。ワンダー操舵では前方の円周上の目標点を少しずつずらして追うため、虫はゆるやかに曲がりながら自然に徘徊する。毎フレームでたらめな方向を選ぶ方式に切り替えると、震えるような動きになる。",
  camera: { position: [0, 10.5, 8.2], target: [0, 0, 0.5] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "方向の決め方",
      value: "wander",
      options: [
        { value: "wander", label: "ワンダー操舵" },
        { value: "random", label: "毎フレーム乱数" },
      ],
    },
    {
      type: "range",
      key: "distance",
      label: "円までの距離",
      min: 0.2,
      max: 3,
      step: 0.05,
      value: 1.4,
    },
    {
      type: "range",
      key: "radius",
      label: "円の半径",
      min: 0.1,
      max: 1.5,
      step: 0.05,
      value: 0.6,
    },
    {
      type: "range",
      key: "jitter",
      label: "揺らぎの強さ（毎秒の角度変化）",
      min: 0,
      max: 12,
      step: 0.1,
      value: 4,
    },
  ],
  legend: [
    { color: palette.amber, label: "観察中の 1 匹と軌跡" },
    { color: palette.cyan, label: "ワンダー円と目標点" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(5);
    const bugs = crowd(COUNT, "#ffffff", {
      geometry: arrowheadGeometry(0.34, 0.14),
    });
    scene.add(bugs);
    const fence = new Mesh(
      new RingGeometry(ARENA, ARENA + 0.08, 96),
      standard(palette.muted, { emissive: 0.3 })
    );
    fence.rotation.x = -Math.PI / 2;
    fence.position.y = 0.01;
    scene.add(fence);

    const positions = Array.from({ length: COUNT }, () => {
      const angle = random() * TAU;
      const radius = Math.sqrt(random()) * (ARENA - 0.5);
      return new Vector3(
        Math.cos(angle) * radius,
        HEIGHT,
        Math.sin(angle) * radius
      );
    });
    const velocities = positions.map(() => {
      const angle = random() * TAU;
      return new Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(
        SPEED
      );
    });
    const wanderAngles = positions.map(() => random() * TAU);
    for (let index = 0; index < COUNT; index++) {
      bugs.paint(index, index === 0 ? palette.amber : "#7d8ba3");
    }

    const circle = polyline([], palette.cyan, { width: 1.5 });
    const toCircle = polyline([], palette.cyan, {
      width: 1,
      dashed: true,
      dashSize: 0.08,
      gapSize: 0.06,
    });
    const wanderPoint = marker(palette.cyan, 0.07);
    const focusTrail = trail(160, palette.amber, { width: 2 });
    scene.add(circle, toCircle, wanderPoint, focusTrail);

    const ahead = new Vector3();
    const target = new Vector3();
    const steer = new Vector3();
    const heading = new Vector3();

    return {
      update({ dt }) {
        const mode = String(params["mode"]);
        const distance = Number(params["distance"]);
        const radius = Number(params["radius"]);
        const jitter = Number(params["jitter"]);
        for (let index = 0; index < COUNT; index++) {
          const position = positions[index];
          const velocity = velocities[index];
          if (!(position && velocity)) {
            continue;
          }
          heading.copy(velocity).normalize();
          if (mode === "wander") {
            // 円周上の目標点の角度を少しずつ乱数でずらす
            const angle =
              (wanderAngles[index] ?? 0) + (random() - 0.5) * 2 * jitter * dt;
            wanderAngles[index] = angle;
            ahead.copy(position).addScaledVector(heading, distance);
            target.set(
              ahead.x + Math.cos(angle) * radius,
              HEIGHT,
              ahead.z + Math.sin(angle) * radius
            );
            steer
              .copy(target)
              .sub(position)
              .setLength(SPEED)
              .sub(velocity)
              .multiplyScalar(3);
            if (index === 0) {
              const points: Vector3[] = [];
              for (let sample = 0; sample <= 48; sample++) {
                const a = (sample / 48) * TAU;
                points.push(
                  new Vector3(
                    ahead.x + Math.cos(a) * radius,
                    HEIGHT,
                    ahead.z + Math.sin(a) * radius
                  )
                );
              }
              circle.setPoints(points);
              toCircle.setPoints([position, ahead]);
              wanderPoint.position.copy(target);
            }
          } else {
            // 比較用：毎フレームまったく新しい方向へ引っ張る
            const angle = random() * TAU;
            steer
              .set(Math.cos(angle), 0, Math.sin(angle))
              .multiplyScalar(SPEED * jitter * 2);
          }
          // 囲いの外へ出そうなら中心へ戻す
          const fromCenter = Math.hypot(position.x, position.z);
          if (fromCenter > ARENA - 0.6) {
            steer.addScaledVector(
              position.clone().setY(0).normalize(),
              -(fromCenter - (ARENA - 0.6)) * 12
            );
          }
          velocity.addScaledVector(limit(steer, 12), dt);
          velocity.setLength(SPEED);
          position.addScaledVector(velocity, dt);
          bugs.set(index, position, velocity);
        }
        bugs.commit();
        const [focus] = positions;
        if (focus) {
          focusTrail.push(focus);
        }
        const wander = mode === "wander";
        circle.visible = wander;
        toCircle.visible = wander;
        wanderPoint.visible = wander;
        context.readout("個体数", `${COUNT} 匹`);
        context.caption(
          wander
            ? "前方に置いた円の上で目標点を少しずつ動かし、それを追う。向きの変化が連続するので、気ままでも滑らかに歩き回る。"
            : "毎フレーム独立な乱数で方向を決めると、変化が打ち消し合って小刻みに震えるだけになる。"
        );
      },
    };
  },
};
