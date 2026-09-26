import {
  BoxGeometry,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, polyline, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

const SEGMENTS = 22;
const SPAN = 8;
const WIDTH = 1.2;
const ANCHOR_Y = 2.4;
const SAG = 1.06;
const BALL_RADIUS = 0.55;
const FLOOR_Y = -3;

type Particle = { position: Vector3; previous: Vector3; pinned: boolean };
type Constraint = { a: number; b: number; length: number; active: boolean };

export const demo: DemoModule = {
  alt: "ロープで吊った板の吊り橋を、ベルレ積分で動かすデモ。各点は「今の位置」と「1 つ前の位置」だけを覚えていて、その差を速度として次の位置を決める。そのあと、点と点の距離をロープの長さに戻す補正をくり返すと、橋はたわみ、揺れ、球を載せると沈み込む。片側のロープを切ると、橋が崖に垂れ下がって振り子のように揺れる。",
  camera: { position: [0, 3.6, 11], target: [0, 1.2, 0] },
  studio: { floor: false },
  controls: [
    { type: "button", key: "cut", label: "左のロープを切る" },
    { type: "button", key: "reset", label: "元に戻す" },
    {
      type: "range",
      key: "iterations",
      label: "距離の補正回数",
      min: 1,
      max: 40,
      step: 1,
      value: 12,
      hint: "少ないとロープがゴムのように伸びます。",
    },
    {
      type: "range",
      key: "damping",
      label: "空気抵抗",
      min: 0,
      max: 0.1,
      step: 0.002,
      value: 0.01,
    },
    { type: "toggle", key: "points", label: "点と速度を表示", value: false },
  ],
  legend: [
    { color: palette.amber, label: "ロープ（距離の拘束）" },
    { color: palette.coral, label: "ドラッグできる球" },
    { color: palette.cyan, label: "速度（今の位置 − 前の位置）" },
  ],
  hint: "赤い球をドラッグして、橋に載せたり押したりできます。",
  setup(context) {
    const { scene, params } = context;
    const particles: Particle[] = [];
    const constraints: Constraint[] = [];
    const index = (side: number, i: number) => side * (SEGMENTS + 1) + i;

    const build = () => {
      particles.length = 0;
      constraints.length = 0;
      for (const side of [0, 1]) {
        for (let i = 0; i <= SEGMENTS; i++) {
          const x = -SPAN / 2 + (i / SEGMENTS) * SPAN;
          const position = new Vector3(x, ANCHOR_Y, (side - 0.5) * WIDTH);
          particles.push({
            position,
            previous: position.clone(),
            pinned: i === 0 || i === SEGMENTS,
          });
        }
      }
      const add = (a: number, b: number, length?: number) => {
        const pa = particles[a]?.position;
        const pb = particles[b]?.position;
        if (pa && pb) {
          constraints.push({
            a,
            b,
            length: length ?? pa.distanceTo(pb),
            active: true,
          });
        }
      };
      for (let i = 0; i < SEGMENTS; i++) {
        // ロープは張った長さより少し長くして、たわませる
        add(index(0, i), index(0, i + 1), (SPAN / SEGMENTS) * SAG);
        add(index(1, i), index(1, i + 1), (SPAN / SEGMENTS) * SAG);
        // 板の対角線：ねじれにくくする
        add(
          index(0, i),
          index(1, i + 1),
          Math.hypot((SPAN / SEGMENTS) * SAG, WIDTH)
        );
        add(
          index(1, i),
          index(0, i + 1),
          Math.hypot((SPAN / SEGMENTS) * SAG, WIDTH)
        );
      }
      for (let i = 0; i <= SEGMENTS; i++) {
        add(index(0, i), index(1, i));
      }
    };
    build();

    // 見た目：崖、柱、板、ロープ
    const cliffMaterial = standard("#5b5146", { roughness: 0.95 });
    for (const side of [-1, 1]) {
      const cliff = new Mesh(new BoxGeometry(3, 6, 4), cliffMaterial);
      cliff.position.set(side * (SPAN / 2 + 1.5), ANCHOR_Y - 3.3, 0);
      cliff.receiveShadow = true;
      scene.add(cliff);
      for (const z of [-WIDTH / 2, WIDTH / 2]) {
        const post = new Mesh(
          new CylinderGeometry(0.08, 0.1, 1.2, 12),
          standard("#8a6a4a")
        );
        post.position.set(side * (SPAN / 2 + 0.05), ANCHOR_Y + 0.2, z);
        post.castShadow = true;
        scene.add(post);
      }
    }
    const river = new Mesh(
      new BoxGeometry(SPAN, 0.2, 8),
      standard("#1d3b4a", { roughness: 0.3 })
    );
    river.position.y = FLOOR_Y - 0.1;
    river.receiveShadow = true;
    scene.add(river);
    const planks = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      standard("#b98a58", { roughness: 0.8 }),
      SEGMENTS + 1
    );
    planks.castShadow = true;
    planks.receiveShadow = true;
    scene.add(planks);
    const ropes = [
      polyline([], palette.amber, { width: 3 }),
      polyline([], palette.amber, { width: 3 }),
    ];
    scene.add(...ropes);
    const dots = new InstancedMesh(
      new SphereGeometry(0.05, 10, 8),
      standard(palette.ink, { emissive: 0.5 }),
      particles.length
    );
    scene.add(dots);
    const velocityLines = segments([], palette.cyan, { width: 2 });
    scene.add(velocityLines);

    const ball = handle(palette.coral, BALL_RADIUS);
    ball.position.set(-2, ANCHOR_Y + 0.9, 0);
    scene.add(ball);
    context.draggable(ball, {
      normal: [0, 0, 1],
      origin: [0, 0, 0],
      clamp: (position) =>
        position.set(
          Math.max(-5, Math.min(5, position.x)),
          Math.max(-1.5, Math.min(5, position.y)),
          0
        ),
    });

    const gravity = new Vector3(0, -9.81, 0);
    const temp = new Vector3();
    const matrix = new Matrix4();
    const tangent = new Vector3();
    const side = new Vector3();
    const normal = new Vector3();
    const center = new Vector3();
    const plankScale = new Vector3();

    const simulate = (dt: number, iterations: number, damping: number) => {
      // 1. ベルレ積分：速度は持たず、今の位置と前の位置の差を速度として使う
      for (const particle of particles) {
        if (particle.pinned) {
          continue;
        }
        temp.copy(particle.position);
        particle.position
          .addScaledVector(temp.clone().sub(particle.previous), 1 - damping)
          .addScaledVector(gravity, dt * dt);
        particle.previous.copy(temp);
      }
      // 2. 距離の拘束と球との衝突を、くり返し少しずつ満たす
      for (let iteration = 0; iteration < iterations; iteration++) {
        for (const constraint of constraints) {
          if (!constraint.active) {
            continue;
          }
          const a = particles[constraint.a];
          const b = particles[constraint.b];
          if (!a || !b) {
            continue;
          }
          temp.subVectors(b.position, a.position);
          const distance = temp.length();
          if (distance < 1e-6) {
            continue;
          }
          const error = (distance - constraint.length) / distance;
          const wa = a.pinned ? 0 : 1;
          const wb = b.pinned ? 0 : 1;
          if (wa + wb === 0) {
            continue;
          }
          a.position.addScaledVector(temp, (error * wa) / (wa + wb));
          b.position.addScaledVector(temp, (-error * wb) / (wa + wb));
        }
        for (const particle of particles) {
          // 崖の壁：橋が崖の中へめり込まないよう押し戻す
          const wall = SPAN / 2 - 0.06;
          if (
            particle.position.y < ANCHOR_Y - 0.1 &&
            Math.abs(particle.position.x) > wall
          ) {
            particle.position.x = Math.sign(particle.position.x) * wall;
          }
          particle.position.y = Math.max(FLOOR_Y + 0.05, particle.position.y);
          temp.subVectors(particle.position, ball.position);
          const distance = temp.length();
          if (!particle.pinned && distance < BALL_RADIUS + 0.08) {
            particle.position
              .copy(ball.position)
              .addScaledVector(
                temp,
                (BALL_RADIUS + 0.08) / Math.max(distance, 1e-4)
              );
          }
        }
      }
    };

    return {
      action(key) {
        if (key === "reset") {
          build();
        } else if (key === "cut") {
          // 左端の固定を外し、左の崖から切り離す
          for (const sideIndex of [0, 1]) {
            const particle = particles[index(sideIndex, 0)];
            if (particle) {
              particle.pinned = false;
            }
          }
        }
      },
      update({ dt }) {
        const iterations = Number(params["iterations"]);
        const damping = Number(params["damping"]);
        const substeps = 3;
        if (dt > 0) {
          for (let s = 0; s < substeps; s++) {
            simulate(dt / substeps, iterations, damping);
          }
        }

        for (const [sideIndex, rope] of ropes.entries()) {
          const points: Vector3[] = [];
          for (let i = 0; i <= SEGMENTS; i++) {
            const particle = particles[index(sideIndex, i)];
            if (particle) {
              points.push(
                particle.position.clone().setY(particle.position.y + 0.06)
              );
            }
          }
          rope.setPoints(points);
        }
        for (let i = 0; i <= SEGMENTS; i++) {
          const a = particles[index(0, i)]?.position;
          const b = particles[index(1, i)]?.position;
          const before = particles[index(0, Math.max(0, i - 1))]?.position;
          const after =
            particles[index(0, Math.min(SEGMENTS, i + 1))]?.position;
          if (!a || !b || !before || !after) {
            continue;
          }
          // 板は、ロープの向き・横方向・その法線でできる向きに置く
          side.subVectors(b, a);
          const width = side.length();
          side.normalize();
          tangent.subVectors(after, before).normalize();
          normal.crossVectors(side, tangent).normalize();
          tangent.crossVectors(normal, side).normalize();
          center.addVectors(a, b).multiplyScalar(0.5);
          matrix.makeBasis(tangent, normal, side);
          plankScale.set((SPAN / SEGMENTS) * 0.82, 0.07, width);
          matrix.scale(plankScale);
          matrix.setPosition(center);
          planks.setMatrixAt(i, matrix);
        }
        planks.instanceMatrix.needsUpdate = true;

        const showPoints = params["points"] === true;
        dots.visible = showPoints;
        velocityLines.visible = showPoints;
        if (showPoints) {
          const segmentsPoints: Vector3[] = [];
          for (const [i, particle] of particles.entries()) {
            matrix.makeTranslation(
              particle.position.x,
              particle.position.y,
              particle.position.z
            );
            dots.setMatrixAt(i, matrix);
          }
          dots.instanceMatrix.needsUpdate = true;
          const rope = particles.slice(0, SEGMENTS + 1);
          for (const particle of rope) {
            segmentsPoints.push(
              particle.position.clone(),
              particle.position
                .clone()
                .add(
                  temp
                    .subVectors(particle.position, particle.previous)
                    .multiplyScalar(12)
                )
            );
          }
          velocityLines.setPoints(segmentsPoints);
        }

        let stretch = 0;
        for (const constraint of constraints) {
          const a = particles[constraint.a]?.position;
          const b = particles[constraint.b]?.position;
          if (a && b) {
            stretch = Math.max(
              stretch,
              a.distanceTo(b) / constraint.length - 1
            );
          }
        }
        context.readout("点の数", `${particles.length}`);
        context.readout("最大の伸び", `${(stretch * 100).toFixed(1)}%`);
        context.caption(
          "各点は速度を持たず、「今の位置 − 前の位置」を速度とみなして進む。そのあと、ロープの点同士の距離を元の長さに戻す補正を何度もくり返す。位置を直接直しても、次のフレームの速度に自然に反映されるのがベルレ積分の強み。"
        );
      },
    };
  },
};
