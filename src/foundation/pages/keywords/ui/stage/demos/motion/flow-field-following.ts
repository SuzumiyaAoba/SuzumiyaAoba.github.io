import {
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  RingGeometry,
  Vector3,
} from "three";
import { arrowheadGeometry, crowd } from "../../agents";
import { palette, perlin2, rng, segments, standard, TAU } from "../../kit";
import type { DemoModule } from "../../types";

const COLS = 26;
const ROWS = 16;
const CELL = 0.46;
const WIDTH = COLS * CELL;
const DEPTH = ROWS * CELL;
const AGENTS = 420;
const SPEED = 1.7;
const HEIGHT = 0.1;

const walls: readonly (readonly [number, number, number, number])[] = [
  [6, 2, 6, 11],
  [12, 5, 12, 15],
  [18, 0, 18, 9],
  [14, 11, 21, 11],
];

export const demo: DemoModule = {
  alt: "床に並んだ矢印の流れ場に沿って、数百体の小さなエージェントが一斉に進むデモ。目的地モードでは、壁を回り込む最短の向きが各マスに書き込まれており、全員が同じ場を参照するだけで迷路を抜けて目的地へ集まる。",
  camera: { position: [0, 10.5, 6.5], target: [0, 0, 0.4] },
  controls: [
    {
      type: "select",
      key: "field",
      label: "流れ場",
      value: "goal",
      options: [
        { value: "goal", label: "目的地への流れ" },
        { value: "wind", label: "ノイズの風" },
      ],
    },
    { type: "toggle", key: "arrows", label: "場の矢印を表示", value: true },
    { type: "button", key: "scatter", label: "エージェントをばらまく" },
  ],
  legend: [
    { color: palette.amber, label: "目的地" },
    { color: palette.muted, label: "各マスの進む向き" },
  ],
  hint: "目的地モードでは、床をクリック（タップ）すると目的地を移せます。流れ場はその場で作り直されます。",
  setup(context) {
    const { scene, params } = context;
    const random = rng(9);
    const blocked = new Uint8Array(COLS * ROWS);
    for (const [x0, z0, x1, z1] of walls) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
          blocked[z * COLS + x] = 1;
        }
      }
    }
    const blockCount = blocked.reduce((sum, value) => sum + value, 0);
    const blocks = new InstancedMesh(
      new BoxGeometry(CELL, 0.5, CELL),
      standard("#3b4658", { roughness: 0.6 }),
      blockCount
    );
    blocks.castShadow = true;
    blocks.receiveShadow = true;
    const matrix = new Matrix4();
    let blockIndex = 0;
    const cellCenter = (x: number, z: number, out = new Vector3()) =>
      out.set(
        (x + 0.5) * CELL - WIDTH / 2,
        HEIGHT,
        (z + 0.5) * CELL - DEPTH / 2
      );
    for (let z = 0; z < ROWS; z++) {
      for (let x = 0; x < COLS; x++) {
        if (blocked[z * COLS + x] === 1) {
          const center = cellCenter(x, z);
          matrix.makeTranslation(center.x, 0.25, center.z);
          blocks.setMatrixAt(blockIndex++, matrix);
        }
      }
    }
    scene.add(blocks);

    const goalRing = new Mesh(
      new RingGeometry(0.2, 0.32, 40),
      standard(palette.amber, { emissive: 1.2 })
    );
    goalRing.rotation.x = -Math.PI / 2;
    scene.add(goalRing);
    let goal = { x: 23, z: 13 };

    const directions = Array.from({ length: COLS * ROWS }, () => new Vector3());
    const distances = new Float32Array(COLS * ROWS);
    const buildGoalField = () => {
      distances.fill(Number.POSITIVE_INFINITY);
      const queue: number[] = [goal.z * COLS + goal.x];
      distances[goal.z * COLS + goal.x] = 0;
      // 4 近傍の幅優先探索で、目的地からの歩数を求める
      // for...of は走査中に push された要素も順に取り出す（キューとして使える）
      for (const current of queue) {
        const cx = current % COLS;
        const cz = Math.floor(current / COLS);
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = cx + dx;
          const nz = cz + dz;
          const next = nz * COLS + nx;
          if (
            nx < 0 ||
            nz < 0 ||
            nx >= COLS ||
            nz >= ROWS ||
            blocked[next] === 1
          ) {
            continue;
          }
          if ((distances[next] ?? 0) > (distances[current] ?? 0) + 1) {
            distances[next] = (distances[current] ?? 0) + 1;
            queue.push(next);
          }
        }
      }
      // 8 近傍のうち最も目的地に近いマスの方向を、そのマスの向きにする
      for (let z = 0; z < ROWS; z++) {
        for (let x = 0; x < COLS; x++) {
          const index = z * COLS + x;
          const direction = directions[index];
          if (!direction) {
            continue;
          }
          direction.set(0, 0, 0);
          let best = distances[index] ?? 0;
          for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const nz = z + dz;
              if (nx < 0 || nz < 0 || nx >= COLS || nz >= ROWS) {
                continue;
              }
              // 斜め移動は角をかすめないよう、両隣が通れるときだけ
              if (
                dx !== 0 &&
                dz !== 0 &&
                (blocked[z * COLS + nx] === 1 || blocked[nz * COLS + x] === 1)
              ) {
                continue;
              }
              const value =
                distances[nz * COLS + nx] ?? Number.POSITIVE_INFINITY;
              if (value < best) {
                best = value;
                direction.set(dx, 0, dz).normalize();
              }
            }
          }
        }
      }
    };
    const buildWindField = (time: number) => {
      for (let z = 0; z < ROWS; z++) {
        for (let x = 0; x < COLS; x++) {
          const angle =
            perlin2(x * 0.12 + time * 0.05, z * 0.12) * TAU * 1.2 + 0.4;
          directions[z * COLS + x]?.set(Math.cos(angle), 0, Math.sin(angle));
        }
      }
    };
    buildGoalField();

    const arrows = segments([], palette.muted, { width: 1.2, opacity: 0.7 });
    scene.add(arrows);
    const agents = crowd(AGENTS, "#ffffff", {
      geometry: arrowheadGeometry(0.2, 0.08),
    });
    scene.add(agents);
    const positions = Array.from({ length: AGENTS }, () => new Vector3());
    const velocities = positions.map(() => new Vector3());
    const scatter = (index: number) => {
      for (let attempt = 0; attempt < 200; attempt++) {
        const x = Math.floor(random() * COLS);
        const z = Math.floor(random() * ROWS);
        if (blocked[z * COLS + x] !== 1) {
          cellCenter(x, z, positions[index]);
          positions[index]?.add(
            new Vector3((random() - 0.5) * CELL, 0, (random() - 0.5) * CELL)
          );
          return;
        }
      }
    };
    for (let index = 0; index < AGENTS; index++) {
      scatter(index);
      agents.paint(
        index,
        index % 3 === 0
          ? palette.cyan
          : index % 3 === 1
            ? palette.sky
            : palette.violet
      );
    }
    const cellOf = (position: Vector3) => {
      const x = Math.floor((position.x + WIDTH / 2) / CELL);
      const z = Math.floor((position.z + DEPTH / 2) / CELL);
      return { x, z, inside: x >= 0 && z >= 0 && x < COLS && z < ROWS };
    };
    context.onPick((point) => {
      const cell = cellOf(point);
      if (cell.inside && blocked[cell.z * COLS + cell.x] !== 1) {
        goal = { x: cell.x, z: cell.z };
        buildGoalField();
      }
    });

    let windClock = 0;
    let usingWind = false;
    const next = new Vector3();
    let arrived = 0;
    return {
      action(key) {
        if (key === "scatter") {
          for (let index = 0; index < AGENTS; index++) {
            scatter(index);
          }
        }
      },
      update({ dt }) {
        const wind = params["field"] === "wind";
        if (wind) {
          windClock += dt;
          buildWindField(windClock);
        } else if (usingWind) {
          buildGoalField();
        }
        usingWind = wind;
        goalRing.visible = !wind;
        goalRing.position.copy(cellCenter(goal.x, goal.z)).setY(0.02);

        for (let index = 0; index < AGENTS; index++) {
          const position = positions[index];
          const velocity = velocities[index];
          if (!(position && velocity)) {
            continue;
          }
          const cell = cellOf(position);
          const direction = cell.inside
            ? directions[cell.z * COLS + cell.x]
            : undefined;
          if (direction) {
            velocity.lerp(
              direction
                .clone()
                .multiplyScalar(SPEED * (0.85 + (index % 5) * 0.06)),
              Math.min(1, dt * 4)
            );
          }
          next.copy(position).addScaledVector(velocity, dt);
          const nextCell = cellOf(next);
          if (
            nextCell.inside &&
            blocked[nextCell.z * COLS + nextCell.x] !== 1
          ) {
            position.copy(next);
          } else if (wind) {
            // 風のモードでは端から反対側へ流れ出る
            position.x =
              next.x > WIDTH / 2
                ? -WIDTH / 2
                : next.x < -WIDTH / 2
                  ? WIDTH / 2
                  : position.x;
            position.z =
              next.z > DEPTH / 2
                ? -DEPTH / 2
                : next.z < -DEPTH / 2
                  ? DEPTH / 2
                  : position.z;
            velocity.multiplyScalar(0.5);
          } else {
            velocity.multiplyScalar(-0.3);
          }
          if (!wind && cell.x === goal.x && cell.z === goal.z) {
            arrived++;
            scatter(index);
          }
          agents.set(index, position, velocity);
        }
        agents.commit();

        arrows.visible = params["arrows"] === true;
        if (arrows.visible) {
          const points: Vector3[] = [];
          for (let z = 0; z < ROWS; z++) {
            for (let x = 0; x < COLS; x++) {
              const index = z * COLS + x;
              const direction = directions[index];
              if (
                blocked[index] === 1 ||
                !direction ||
                direction.lengthSq() === 0
              ) {
                continue;
              }
              const center = cellCenter(x, z).setY(0.02);
              points.push(
                center.clone().addScaledVector(direction, -CELL * 0.3),
                center.clone().addScaledVector(direction, CELL * 0.3)
              );
            }
          }
          arrows.setPoints(points);
        }
        context.readout("エージェント", `${AGENTS} 体`);
        context.readout("流れ場のマス", `${COLS} × ${ROWS}`);
        if (!wind) {
          context.readout("到着した数", `${arrived}`);
        }
        context.caption(
          wind
            ? "場の矢印はノイズで決めた風向き。すべての粒子が同じ場を読むだけで、流れに乗った群れの動きになる。"
            : "目的地からの距離を 1 回だけ幅優先で広げ、各マスに『近づく向き』を書き込む。何百体いても、経路探索は 1 回で済む。"
        );
      },
    };
  },
};
