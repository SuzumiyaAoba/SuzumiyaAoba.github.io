import {
  Color,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { arrowheadGeometry, crowd, limit } from "../../agents";
import { palette, rng, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const COUNT = 380;
const CENTER = new Vector3(0, 2.6, 0);
const BOUNDS = 4.2;
const MAX_SPEED = 3.2;
const MIN_SPEED = 1.4;
const MAX_FORCE = 6;

export const demo: DemoModule = {
  alt: "数百匹の魚の群れ。各個体は近くの仲間とぶつからないよう離れ、向きをそろえ、群れの中心へ寄るという 3 つの規則だけで動き、全体として渦を巻く群れが生まれる。捕食者を出すと群れが割れて逃げる。",
  camera: { position: [7.5, 4.5, 8.5], target: [0, 2.5, 0], autoRotate: 3 },
  controls: [
    {
      type: "range",
      key: "separation",
      label: "分離（離れる）",
      min: 0,
      max: 4,
      step: 0.05,
      value: 1.6,
    },
    {
      type: "range",
      key: "alignment",
      label: "整列（向きをそろえる）",
      min: 0,
      max: 4,
      step: 0.05,
      value: 1,
    },
    {
      type: "range",
      key: "cohesion",
      label: "結合（中心へ寄る）",
      min: 0,
      max: 4,
      step: 0.05,
      value: 0.8,
    },
    {
      type: "range",
      key: "radius",
      label: "近傍の半径",
      min: 0.3,
      max: 2.5,
      step: 0.05,
      value: 1.1,
      format: (value) => `${value.toFixed(2)} m`,
    },
    { type: "toggle", key: "predator", label: "捕食者を放つ", value: false },
    {
      type: "toggle",
      key: "neighbors",
      label: "1 匹の近傍を表示",
      value: true,
    },
  ],
  legend: [
    { color: palette.amber, label: "観察中の 1 匹" },
    { color: palette.cyan, label: "その近傍の仲間" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(12);
    const fish = crowd(COUNT, "#ffffff", {
      geometry: arrowheadGeometry(0.3, 0.09),
    });
    scene.add(fish);
    const positions = Array.from(
      { length: COUNT },
      () =>
        new Vector3(
          (random() - 0.5) * 6,
          2.6 + (random() - 0.5) * 3,
          (random() - 0.5) * 6
        )
    );
    const velocities = positions.map(() =>
      new Vector3(
        random() - 0.5,
        (random() - 0.5) * 0.4,
        random() - 0.5
      ).setLength(2)
    );
    const baseColors = positions.map((_, index) =>
      new Color().setHSL(
        0.52 + (index % 7) * 0.02,
        0.6,
        0.4 + (index % 5) * 0.04
      )
    );

    const bubble = new Mesh(
      new SphereGeometry(1, 32, 24),
      new MeshStandardMaterial({
        color: palette.amber,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
      })
    );
    const links = segments([], palette.cyan, { width: 1, opacity: 0.6 });
    const shark = new Mesh(
      arrowheadGeometry(0.9, 0.3),
      standard(palette.coral, { emissive: 0.3 })
    );
    shark.castShadow = true;
    scene.add(bubble, links, shark);

    const separation = new Vector3();
    const alignment = new Vector3();
    const cohesion = new Vector3();
    const steer = new Vector3();
    const offset = new Vector3();
    const sharkPosition = new Vector3(0, 2.6, 0);
    const sharkVelocity = new Vector3(2.5, 0, 0);
    const neighborFlags = new Uint8Array(COUNT);
    let sharkPhase = 0;

    return {
      update({ dt }) {
        const radius = Number(params["radius"]);
        const radiusSq = radius * radius;
        const separationSq = radiusSq * 0.2;
        const wSeparation = Number(params["separation"]);
        const wAlignment = Number(params["alignment"]);
        const wCohesion = Number(params["cohesion"]);
        const predator = params["predator"] === true;
        const step = Math.min(dt, 1 / 30);

        sharkPhase += step * 0.5;
        const sharkTarget = new Vector3(
          Math.cos(sharkPhase) * 3,
          2.6 + Math.sin(sharkPhase * 2.3) * 1.2,
          Math.sin(sharkPhase * 1.3) * 3
        );
        sharkVelocity.lerp(
          sharkTarget.sub(sharkPosition).setLength(2.8),
          step * 1.5
        );
        sharkPosition.addScaledVector(sharkVelocity, step);
        shark.visible = predator;
        shark.position.copy(sharkPosition);
        shark.lookAt(sharkPosition.clone().add(sharkVelocity));

        neighborFlags.fill(0);
        for (let i = 0; i < COUNT; i++) {
          const position = positions[i];
          const velocity = velocities[i];
          if (!(position && velocity)) {
            continue;
          }
          separation.set(0, 0, 0);
          alignment.set(0, 0, 0);
          cohesion.set(0, 0, 0);
          let neighbors = 0;
          let crowded = 0;
          for (let j = 0; j < COUNT; j++) {
            if (i === j) {
              continue;
            }
            const other = positions[j];
            const otherVelocity = velocities[j];
            if (!(other && otherVelocity)) {
              continue;
            }
            offset.copy(position).sub(other);
            const distanceSq = offset.lengthSq();
            if (distanceSq < radiusSq && distanceSq > 1e-6) {
              // 分離はごく近い相手だけから受ける（近傍半径の 0.45 倍）
              if (distanceSq < separationSq) {
                separation.addScaledVector(offset, 1 / distanceSq);
                crowded++;
              }
              alignment.add(otherVelocity);
              cohesion.add(other);
              neighbors++;
              if (i === 0) {
                neighborFlags[j] = 1;
              }
            }
          }
          steer.set(0, 0, 0);
          if (neighbors > 0) {
            alignment
              .divideScalar(neighbors)
              .setLength(MAX_SPEED)
              .sub(velocity);
            cohesion
              .divideScalar(neighbors)
              .sub(position)
              .setLength(MAX_SPEED)
              .sub(velocity);
            if (crowded > 0) {
              separation.setLength(MAX_SPEED).sub(velocity);
            }
            steer
              .addScaledVector(limit(separation, MAX_FORCE), wSeparation)
              .addScaledVector(limit(alignment, MAX_FORCE), wAlignment)
              .addScaledVector(limit(cohesion, MAX_FORCE), wCohesion);
          }
          // 水槽の外へ出ないように中心へ引き戻す
          offset.copy(position).sub(CENTER);
          offset.y *= 1.8;
          const outside = offset.length() - BOUNDS;
          if (outside > 0) {
            steer.addScaledVector(offset.normalize(), -outside * 8);
          }
          if (predator) {
            offset.copy(position).sub(sharkPosition);
            const distance = offset.length();
            if (distance < 2.2) {
              steer.addScaledVector(offset.normalize(), (2.2 - distance) * 18);
            }
          }
          velocity.addScaledVector(steer, step);
          const speed = velocity.length();
          velocity.setLength(Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed)));
        }
        for (let i = 0; i < COUNT; i++) {
          const position = positions[i];
          const velocity = velocities[i];
          if (!(position && velocity)) {
            continue;
          }
          position.addScaledVector(velocity, step);
          fish.set(i, position, velocity);
        }

        const showNeighbors = params["neighbors"] === true;
        const [focus] = positions;
        const linkPoints: Vector3[] = [];
        let neighborCount = 0;
        for (let i = 0; i < COUNT; i++) {
          const isNeighbor = neighborFlags[i] === 1;
          if (isNeighbor) {
            neighborCount++;
          }
          if (i === 0 && showNeighbors) {
            fish.paint(i, palette.amber);
          } else if (isNeighbor && showNeighbors) {
            fish.paint(i, palette.cyan);
            const other = positions[i];
            if (focus && other) {
              linkPoints.push(focus, other);
            }
          } else {
            fish.paint(i, baseColors[i] ?? palette.ink);
          }
        }
        fish.commit();
        bubble.visible = showNeighbors;
        links.visible = showNeighbors && linkPoints.length > 0;
        if (focus) {
          bubble.position.copy(focus);
          bubble.scale.setScalar(radius);
        }
        if (links.visible) {
          links.setPoints(linkPoints);
        }
        context.readout("個体数", `${COUNT} 匹`);
        context.readout("観察中の 1 匹の近傍", `${neighborCount} 匹`);
        context.caption(
          "分離・整列・結合。どの個体も近くの仲間しか見ていないのに、群れ全体としての形と流れが生まれる。"
        );
      },
    };
  },
};
