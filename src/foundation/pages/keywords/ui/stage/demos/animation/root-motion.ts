import { CylinderGeometry, Mesh, Vector3 } from "three";
import { palette, polyline, standard } from "../../kit";
import { mannequin, walkPose } from "../../mannequin";
import type { Mannequin, Side } from "../../mannequin";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const CYCLE_LENGTH = 1.45;
const CLIP = 6;
const START_Z = -2.6;
const SIDES: readonly Side[] = ["L", "R"];

/** アニメーション（歩き出し → 歩く → 止まる → 立ち止まる）が想定している前進の速さ。 */
function clipSpeed(t: number) {
  if (t < 1) {
    return 1.1 * t;
  }
  if (t < 3.2) {
    return 1.1;
  }
  if (t < 4.2) {
    return 1.1 * (4.2 - t);
  }
  return 0;
}

/** 歩いた距離（速さの積分）。 */
function clipDistance(t: number) {
  let distance = 0;
  const steps = 200;
  for (let i = 0; i < steps; i++) {
    distance += clipSpeed(((i + 0.5) / steps) * t) * (t / steps);
  }
  return distance;
}

const AVERAGE_SPEED = clipDistance(CLIP) / CLIP;

type Actor = {
  man: Mannequin;
  x: number;
  rootMotion: boolean;
  z: number;
  previousLocal: Record<Side, Vector3>;
  support: Side;
  offsetX: number;
  planted: Record<Side, Vector3 | null>;
  slide: number;
  trail: ReturnType<typeof polyline>;
  trailPoints: Vector3[];
  prints: Mesh[];
  printIndex: number;
};

export const demo: DemoModule = {
  alt: "歩き出して、歩いて、止まるアニメーションを、2 通りの方法で動かすデモ。左はアニメーションをその場で再生し、キャラクター本体をプログラムで一定の速さで動かす。歩き出しや止まる瞬間に、足が地面の上を滑る。右はルートモーションで、アニメーションに含まれる前進の量をそのまま本体の移動に使うので、足が地面に吸い付いたように止まり、滑らない。",
  camera: { position: [4.4, 1.6, 0.2], target: [0, 0.7, 0] },
  controls: [
    {
      type: "range",
      key: "rate",
      label: "再生速度",
      min: 0.25,
      max: 1.5,
      step: 0.05,
      value: 0.8,
    },
    { type: "toggle", key: "trail", label: "足の滑りを線で表示", value: true },
  ],
  legend: [
    { color: palette.coral, label: "足跡（着地した位置）" },
    { color: palette.amber, label: "着地中に足が滑った跡" },
    { color: palette.sky, label: "アニメーションが想定する速さ" },
    { color: palette.lime, label: "プログラムで与えた速さ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const actors: Actor[] = [
      { x: -0.75, rootMotion: false, color: "#f2a65a" },
      { x: 0.75, rootMotion: true, color: "#5aa9ff" },
    ].map(({ x, rootMotion, color }) => {
      const man = mannequin({ accent: color });
      scene.add(man.root);
      const trail = polyline([], palette.amber, { width: 3 });
      scene.add(trail);
      const prints = Array.from({ length: 12 }, () => {
        const print = new Mesh(
          new CylinderGeometry(0.05, 0.05, 0.01, 16),
          standard(palette.coral, { emissive: 0.6 })
        );
        print.visible = false;
        scene.add(print);
        return print;
      });
      const label = context.label(
        rootMotion ? "ルートモーション" : "その場再生 + 一定速度",
        { tone: "strong" }
      );
      label.position.set(x, 2.1, 0);
      man.root.add(label);
      label.position.set(0, 2.1, 0);
      return {
        man,
        x,
        rootMotion,
        z: START_Z,
        previousLocal: { L: new Vector3(), R: new Vector3() },
        support: "L",
        offsetX: 0,
        planted: { L: null, R: null },
        slide: 0,
        trail,
        trailPoints: [],
        prints,
        printIndex: 0,
      };
    });
    const graph = historyGraph(context, {
      title: "前進の速さ（m/s）",
      min: 0,
      max: 1.4,
      series: [{ color: palette.sky }, { color: palette.lime }],
    });

    let time = 0;
    const foot = new Vector3();
    return {
      update({ dt }) {
        const step = dt * Number(params["rate"]);
        time += step;
        if (time >= CLIP) {
          time -= CLIP;
          for (const actor of actors) {
            actor.z = START_Z;
            actor.trailPoints = [];
            actor.planted = { L: null, R: null };
            actor.slide = 0;
            actor.offsetX = 0;
          }
        }

        // アニメーションの進み具合：足が滑らないよう、歩いた距離に合わせて歩行周期を進める
        const distance = clipDistance(time);
        const phase = (distance / CYCLE_LENGTH) % 1;
        const stride = Math.min(1, clipSpeed(time) / 1.1 + 0.001);
        for (const actor of actors) {
          const { man } = actor;
          man.rest();
          walkPose(man, phase, stride);
          // 本体の移動：ルートモーションは、アニメーションの中で着地している足が後ろへ動いた分だけ本体を前へ進める
          man.root.position.set(0, 0, 0);
          man.root.updateMatrixWorld(true);
          const local = {
            L: man.foot.L.getWorldPosition(new Vector3()),
            R: man.foot.R.getWorldPosition(new Vector3()),
          };
          if (actor.rootMotion) {
            const support: Side = local.L.y < local.R.y ? "L" : "R";
            // 支えている足が、直前と同じ足のときだけ、その足の動きを打ち消すように本体を動かす
            if (support === actor.support && step > 0) {
              const dz = actor.previousLocal[support].z - local[support].z;
              const dx = actor.previousLocal[support].x - local[support].x;
              if (Math.abs(dz) < 0.2) {
                actor.z += dz;
                actor.offsetX += dx;
              }
            }
            actor.support = support;
          } else {
            actor.z = START_Z + AVERAGE_SPEED * time;
          }
          actor.previousLocal = { L: local.L.clone(), R: local.R.clone() };
          man.root.position.set(actor.x + actor.offsetX, 0, actor.z);
          man.root.updateMatrixWorld(true);
          for (const side of SIDES) {
            man.foot[side].getWorldPosition(foot);
            // 体重を支えている（低い方の）足だけを「着地中」とみなす
            const other = side === "L" ? local.R : local.L;
            const planted = foot.y < 0.085 && foot.y <= other.y + 1e-4;
            const previous = actor.planted[side];
            if (planted && !previous) {
              actor.planted[side] = foot.clone();
              const print =
                actor.prints[actor.printIndex % actor.prints.length];
              actor.printIndex++;
              if (print) {
                print.visible = true;
                print.position.set(foot.x, 0.006, foot.z + 0.05);
              }
            } else if (planted && previous) {
              const moved = Math.hypot(
                foot.x - previous.x,
                foot.z - previous.z
              );
              if (moved > 0.002) {
                actor.slide += moved;
                actor.trailPoints.push(
                  previous.clone().setY(0.02),
                  foot.clone().setY(0.02)
                );
              }
              previous.copy(foot);
            } else if (!planted) {
              actor.planted[side] = null;
            }
          }
          actor.trail.visible =
            params["trail"] === true && actor.trailPoints.length > 1;
          if (actor.trail.visible) {
            actor.trail.setPoints(actor.trailPoints);
          }
        }
        if (step > 0) {
          graph.push([clipSpeed(time), AVERAGE_SPEED]);
        }
        const [inPlace, root] = actors;
        context.readout(
          "その場再生の滑り",
          `${((inPlace?.slide ?? 0) * 100).toFixed(0)} cm`
        );
        context.readout(
          "ルートモーションの滑り",
          `${((root?.slide ?? 0) * 100).toFixed(0)} cm`
        );
        context.caption(
          time < 1
            ? "歩き出し：アニメーションはゆっくり足を出しているのに、左はプログラムで最初から一定の速さで進むので、足が地面を滑る。"
            : time < 3.2
              ? "歩いている間は、左も右もほぼ同じ速さなので差が小さい。"
              : "止まる：アニメーションは立ち止まっているのに、左は一定の速さで進み続けるので、足を着いたまま前へ滑っていく。右はアニメーションの前進量で動くので、ぴたりと止まる。"
        );
      },
    };
  },
};
