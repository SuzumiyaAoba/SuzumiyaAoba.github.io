import { CylinderGeometry, Mesh, Vector3 } from "three";
import { arrowheadGeometry, crowd, limit } from "../../agents";
import { palette, rng, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const AGENTS = 28;
const AGENT_RADIUS = 0.18;
const HEIGHT = 0.15;
const START_X = -5.6;
const END_X = 5.6;

type Pillar = { center: Vector3; radius: number };

export const demo: DemoModule = {
  alt: "柱が立ち並ぶ広場を、左から右へ横切るエージェントの群れ。各エージェントは進行方向に触角のような先読み線を伸ばし、柱に触れそうなら横へ舵を切ってよける。回避をオフにすると柱にぶつかって詰まる。",
  camera: { position: [0, 9.2, 6.6], target: [0, 0, 0.3] },
  controls: [
    { type: "toggle", key: "avoid", label: "障害物回避", value: true },
    {
      type: "range",
      key: "lookAhead",
      label: "先読みの長さ",
      min: 0.3,
      max: 3,
      step: 0.05,
      value: 1.4,
      format: (value) => `${value.toFixed(2)} m`,
      hint: "短いと直前で急旋回し、長いと早めに大きく迂回します。",
    },
    {
      type: "range",
      key: "strength",
      label: "回避の強さ",
      min: 1,
      max: 30,
      step: 0.5,
      value: 14,
    },
    { type: "toggle", key: "feelers", label: "先読み線を表示", value: true },
  ],
  legend: [
    { color: palette.muted, label: "先読み線（何もない）" },
    { color: palette.coral, label: "先読み線（柱を検知）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(31);
    const pillars: Pillar[] = [];
    for (let attempt = 0; pillars.length < 11 && attempt < 400; attempt++) {
      const center = new Vector3(
        (random() - 0.5) * 7.5,
        0,
        (random() - 0.5) * 5.6
      );
      const radius = 0.3 + random() * 0.35;
      if (
        pillars.every(
          (pillar) =>
            pillar.center.distanceTo(center) > pillar.radius + radius + 0.7
        )
      ) {
        pillars.push({ center, radius });
      }
    }
    for (const pillar of pillars) {
      const mesh = new Mesh(
        new CylinderGeometry(pillar.radius, pillar.radius, 1.2, 32),
        standard("#4a566b", { roughness: 0.5 })
      );
      mesh.position.set(pillar.center.x, 0.6, pillar.center.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }
    const agents = crowd(AGENTS, palette.cyan, {
      geometry: arrowheadGeometry(0.4, 0.16),
    });
    scene.add(agents);
    const positions = Array.from(
      { length: AGENTS },
      (_, index) =>
        new Vector3(
          START_X + random() * (END_X - START_X),
          HEIGHT,
          (index / AGENTS - 0.5) * 5.4
        )
    );
    const velocities = positions.map(() => new Vector3(1.4, 0, 0));
    const lanes = positions.map((position) => position.z);
    const quiet = segments([], palette.muted, { width: 1.2, opacity: 0.6 });
    const alert = segments([], palette.coral, { width: 2 });
    scene.add(quiet, alert);

    const desired = new Vector3();
    const steer = new Vector3();
    const ahead = new Vector3();
    const toCenter = new Vector3();
    const closest = new Vector3();
    const heading = new Vector3();
    let bumps = 0;

    return {
      update({ dt }) {
        const avoid = params["avoid"] === true;
        const lookAhead = Number(params["lookAhead"]);
        const strength = Number(params["strength"]);
        const quietPoints: Vector3[] = [];
        const alertPoints: Vector3[] = [];
        for (let index = 0; index < AGENTS; index++) {
          const position = positions[index];
          const velocity = velocities[index];
          if (!(position && velocity)) {
            continue;
          }
          // 目標：右へ進みつつ自分の列（z）に戻る
          desired.set(1.6, 0, ((lanes[index] ?? 0) - position.z) * 0.8);
          steer.copy(desired).sub(velocity).multiplyScalar(2);
          heading.copy(velocity).normalize();
          ahead.copy(position).addScaledVector(heading, lookAhead);
          let threat: Pillar | undefined;
          let nearest = Number.POSITIVE_INFINITY;
          for (const pillar of pillars) {
            // 先読み線分上で柱の中心に最も近い点を求める
            toCenter.copy(pillar.center).setY(HEIGHT).sub(position);
            const along = Math.max(
              0,
              Math.min(lookAhead, toCenter.dot(heading))
            );
            closest.copy(position).addScaledVector(heading, along);
            const gap = closest.distanceTo(pillar.center.clone().setY(HEIGHT));
            if (gap < pillar.radius + AGENT_RADIUS + 0.1 && along < nearest) {
              nearest = along;
              threat = pillar;
            }
          }
          if (threat && avoid) {
            // 柱の中心から見て先読み点が外れる向きへ、横方向の力をかける
            const away = ahead.clone().sub(threat.center.clone().setY(HEIGHT));
            away.addScaledVector(heading, -away.dot(heading));
            if (away.lengthSq() < 1e-4) {
              away.set(-heading.z, 0, heading.x);
            }
            steer.addScaledVector(
              away.normalize(),
              strength * (1 - nearest / (lookAhead + 1e-3) + 0.3)
            );
          }
          velocity.addScaledVector(limit(steer, 30), dt);
          limit(velocity, 2.2);
          position.addScaledVector(velocity, dt);
          // 柱にめり込んだら押し戻す（回避しない場合はここで詰まる）
          for (const pillar of pillars) {
            toCenter.copy(position).sub(pillar.center.clone().setY(HEIGHT));
            const overlap = pillar.radius + AGENT_RADIUS - toCenter.length();
            if (overlap > 0) {
              position.addScaledVector(toCenter.normalize(), overlap);
              velocity.addScaledVector(toCenter, -velocity.dot(toCenter));
              bumps += dt;
            }
          }
          if (position.x > END_X) {
            position.x = START_X;
          }
          agents.set(index, position, velocity);
          (threat ? alertPoints : quietPoints).push(
            position.clone().setY(0.2),
            ahead.clone().setY(0.2)
          );
        }
        agents.commit();
        const showFeelers = params["feelers"] === true;
        quiet.visible = showFeelers && quietPoints.length > 0;
        alert.visible = showFeelers && alertPoints.length > 0;
        if (quiet.visible) {
          quiet.setPoints(quietPoints);
        }
        if (alert.visible) {
          alert.setPoints(alertPoints);
        }
        context.readout(
          "柱を検知しているエージェント",
          `${alertPoints.length / 2} 体`
        );
        context.readout(
          "柱に接触していた時間（合計）",
          `${bumps.toFixed(1)} 秒`
        );
        context.caption(
          avoid
            ? "進行方向に伸ばした先読み線が柱にかかったら、柱から離れる横向きの力を足す。目標へ向かう力と合成され、流れるように迂回する。"
            : "回避なし：目標へまっすぐ進む力しかないので、柱に正面からぶつかり、押し戻されながら滑るように回り込むしかない。"
        );
      },
    };
  },
};
