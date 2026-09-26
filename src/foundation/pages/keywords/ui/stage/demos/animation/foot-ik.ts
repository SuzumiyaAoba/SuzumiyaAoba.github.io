import { CylinderGeometry, Group, Mesh, PlaneGeometry, Vector3 } from "three";
import { palette, polyline, standard } from "../../kit";
import {
  applyTwoBone,
  BODY,
  levelFoot,
  mannequin,
  walkPose,
} from "../../mannequin";
import type { Side } from "../../mannequin";
import type { DemoModule } from "../../types";

const TRACK = 7;
const CYCLE_LENGTH = 1.45; // 歩行アニメーション 1 周期で進む距離（m）
const ANKLE = 0.06;
const SIDES: readonly Side[] = ["L", "R"];
const PRINTS = 14;

/** でこぼこの地面：ゆるい起伏と、段差。 */
function ground(x: number, z: number) {
  // TRACK ごとにくり返す地形（z は歩いた距離で測った絶対位置）
  const k = (Math.PI * 2) / TRACK;
  const bumps =
    0.08 * Math.sin(z * k * 2 + 0.5) + 0.05 * Math.sin(z * k * 5 + x * 2);
  const local = z - Math.floor(z / TRACK) * TRACK;
  const step = local > 3.4 && local < 4.6 ? 0.18 : 0;
  return Math.max(0, bumps + 0.06) + step;
}

export const demo: DemoModule = {
  alt: "でこぼこの地面を歩くキャラクターで、足の IK と足の固定（フットロック）を確かめるデモ。平らな床用に作った歩きのアニメーションをそのまま再生すると、足が地面にめり込んだり浮いたりする。フット IK は、足の真下の地面の高さを調べて足を合わせ、腰を下げて脚を届かせる。フットロックは、足が地面に着いている間だけ足の位置を固定し、移動の速さと歩幅が合わないときの足の滑りを防ぐ。",
  camera: { position: [3.2, 1.5, 1.2], target: [0, 0.6, 0.5] },
  controls: [
    {
      type: "toggle",
      key: "ik",
      label: "フット IK（地面の高さに合わせる）",
      value: true,
    },
    {
      type: "toggle",
      key: "lock",
      label: "フットロック（着地中の足を固定）",
      value: true,
    },
    {
      type: "range",
      key: "mismatch",
      label: "移動の速さ ÷ アニメーションの歩幅",
      min: 0.5,
      max: 1.8,
      step: 0.05,
      value: 1.25,
      hint: "1 のとき、アニメーションの歩幅と実際の移動がちょうど合います。",
    },
    {
      type: "range",
      key: "speed",
      label: "歩く速さ",
      min: 0.3,
      max: 1.6,
      step: 0.05,
      value: 0.9,
      format: (value) => `${value} m/s`,
    },
  ],
  legend: [
    { color: palette.coral, label: "足跡（着地した位置）" },
    { color: palette.amber, label: "着地中の足の滑り" },
  ],
  setup(context) {
    const { scene, params } = context;
    // 人物はその場にとどめ、地面や足跡をまとめた world を後ろへ流す
    const world = new Group();
    scene.add(world);
    const man = mannequin();
    world.add(man.root);
    const terrain = new PlaneGeometry(2.4, TRACK, 48, 180);
    terrain.rotateX(-Math.PI / 2);
    terrain.translate(0, 0, TRACK / 2);
    const position = terrain.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      position.setY(i, ground(position.getX(i), position.getZ(i)));
    }
    terrain.computeVertexNormals();
    const floorMaterial = standard("#5b6b55", { roughness: 0.95 });
    const floors = [0, 1, 2].map(() => {
      const floor = new Mesh(terrain, floorMaterial);
      floor.receiveShadow = true;
      world.add(floor);
      return floor;
    });

    const prints = Array.from({ length: PRINTS }, () => {
      const print = new Mesh(
        new CylinderGeometry(0.05, 0.05, 0.01, 16),
        standard(palette.coral, { emissive: 0.6 })
      );
      print.visible = false;
      world.add(print);
      return print;
    });
    let printIndex = 0;
    const slides = SIDES.map(() => polyline([], palette.amber, { width: 3 }));
    world.add(...slides);

    let z = 0;
    let phase = 0;
    const lock: Record<
      Side,
      { active: boolean; position: Vector3; slide: Vector3[] }
    > = {
      L: { active: false, position: new Vector3(), slide: [] },
      R: { active: false, position: new Vector3(), slide: [] },
    };
    let slideTotal = 0;
    const fk = { L: new Vector3(), R: new Vector3() };
    const targetPosition = new Vector3();

    return {
      update({ dt }) {
        const speed = Number(params["speed"]);
        const mismatch = Number(params["mismatch"]);
        const useIk = params["ik"] === true;
        const useLock = params["lock"] === true;
        // 本体の移動と、アニメーションの進み方（ずれがあると足が滑る）
        z += speed * dt;
        phase = (phase + (speed * dt) / (CYCLE_LENGTH * mismatch)) % 1;
        world.position.z = -z;
        for (const [index, floor] of floors.entries()) {
          floor.position.z = (Math.floor(z / TRACK) + index - 1) * TRACK;
        }
        man.rest();
        walkPose(man, phase, 1);
        man.root.position.set(0, 0, z);
        world.updateMatrixWorld(true);
        for (const side of SIDES) {
          // world の中の座標（歩いた距離で測った絶対位置）に直す
          world.worldToLocal(man.foot[side].getWorldPosition(fk[side]));
        }

        // フット IK：足の下の地面の高さを調べ、足を持ち上げる。低い方の足に合わせて腰を下げる
        const targets = { L: fk.L.clone(), R: fk.R.clone() };
        let hipDrop = 0;
        for (const side of SIDES) {
          const t = targets[side];
          const lift = Math.max(fk[side].y, ANKLE);
          if (useIk) {
            t.y = ground(t.x, t.z) + lift;
          }
          hipDrop = Math.min(hipDrop, t.y - fk[side].y);
        }
        // 着地の判定：アニメーション上で足が床に近い間は「着地中」
        for (const side of SIDES) {
          const planted = fk[side].y < ANKLE + 0.025;
          const state = lock[side];
          if (planted && !state.active) {
            state.active = true;
            state.position.copy(targets[side]);
            state.slide = [targets[side].clone()];
            const print = prints[printIndex % PRINTS];
            printIndex++;
            if (print) {
              print.visible = true;
              print.position.set(
                targets[side].x,
                ground(targets[side].x, targets[side].z) + 0.006,
                targets[side].z + 0.05
              );
            }
          } else if (!planted || state.position.distanceTo(fk[side]) > 0.3) {
            // 足が浮いた、または固定した位置から離れすぎた（脚が伸び切る）ら固定を外す
            state.active = false;
          }
          if (state.active) {
            if (useLock) {
              targets[side].x = state.position.x;
              targets[side].z = state.position.z;
            } else {
              const last = state.slide.at(-1);
              if (last) {
                slideTotal += Math.hypot(
                  targets[side].x - last.x,
                  targets[side].z - last.z
                );
              }
              state.slide.push(targets[side].clone());
            }
          }
        }
        if (useIk || useLock) {
          man.hips.position.y += useIk ? hipDrop : 0;
          world.updateMatrixWorld(true);
          for (const side of SIDES) {
            const hip = man.upperLeg[side].getWorldPosition(new Vector3());
            const pole = hip.clone().add(new Vector3(0, -0.2, 1));
            targetPosition.copy(targets[side]);
            world.localToWorld(targetPosition);
            applyTwoBone(
              man.upperLeg[side],
              man.lowerLeg[side],
              targetPosition,
              pole,
              BODY.upperLeg,
              BODY.lowerLeg
            );
            // 足の裏を地面の傾きに合わせる
            const tz = targets[side].z;
            const slope = useIk
              ? Math.atan2(ground(0, tz + 0.05) - ground(0, tz - 0.05), 0.1)
              : 0;
            levelFoot(
              man.foot[side],
              0,
              lock[side].active ? slope : slope - 0.3
            );
          }
        }
        for (const [index, side] of SIDES.entries()) {
          const line = slides[index];
          if (line) {
            line.visible = !useLock && lock[side].slide.length > 1;
            line.setPoints(
              lock[side].slide.map((p) => p.clone().setY(p.y - ANKLE + 0.02))
            );
          }
        }
        slideTotal *= 0.995;
        context.readout(
          "足の滑り（直近）",
          `${(slideTotal * 100).toFixed(0)} cm`
        );
        context.caption(
          useIk
            ? "アニメーションの足の位置の真下で地面の高さを調べ、その高さに足を合わせる。段差の上では脚が届かなくなるので、低い方の足に合わせて腰を下げ、両脚を 2 ボーン IK で解き直す。"
            : "平らな床用のアニメーションをそのまま再生すると、段差やでこぼこの上で足が地面にめり込んだり、宙に浮いたりする。"
        );
      },
    };
  },
};
