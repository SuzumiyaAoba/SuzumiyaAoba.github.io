import {
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { palette, polyline, standard } from "../../kit";
import { hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const REST = new Vector3(0, 1.9, 0);
const HISTORY = 240;
const SUBSTEPS = 8;

export const demo: DemoModule = {
  alt: "台座の上にばねで取り付けた標的。台座が素早く左右に動いたり、叩いたりすると、標的はばねで引き戻されながら揺れ、減衰で次第に止まる。右下のグラフは横方向のずれの時間変化。",
  camera: { position: [0.4, 3.2, 7.2], target: [0, 1.5, 0] },
  controls: [
    {
      type: "range",
      key: "stiffness",
      label: "ばね定数 k（硬さ）",
      min: 5,
      max: 250,
      step: 1,
      value: 90,
    },
    {
      type: "range",
      key: "damping",
      label: "減衰係数 c",
      min: 0,
      max: 25,
      step: 0.1,
      value: 3.2,
    },
    { type: "toggle", key: "move", label: "台座を動かす", value: true },
    { type: "button", key: "hit", label: "叩く" },
  ],
  legend: [
    { color: palette.amber, label: "ばね" },
    { color: palette.cyan, label: "横方向のずれ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const base = new Group();
    const plate = new Mesh(
      new CylinderGeometry(0.7, 0.8, 0.2, 40),
      standard("#3a4658", { metalness: 0.4, roughness: 0.4 })
    );
    plate.position.y = 0.1;
    const post = new Mesh(
      new CylinderGeometry(0.08, 0.08, 0.5, 16),
      standard("#566378", { metalness: 0.6, roughness: 0.3 })
    );
    post.position.y = 0.45;
    base.add(plate, post);
    base.traverse((child) => {
      child.castShadow = true;
    });

    const head = new Group();
    const ball = new Mesh(
      new SphereGeometry(0.45, 40, 30),
      standard("#f2efe8", { roughness: 0.35 })
    );
    const stripe = new Mesh(
      new TorusGeometry(0.46, 0.05, 12, 48),
      standard(palette.coral, { emissive: 0.3 })
    );
    stripe.rotation.y = Math.PI / 2;
    const bullseye = new Mesh(
      new TorusGeometry(0.22, 0.05, 12, 48),
      standard(palette.coral, { emissive: 0.3 })
    );
    bullseye.position.z = 0.4;
    head.add(ball, stripe, bullseye);
    head.traverse((child) => {
      child.castShadow = true;
    });
    const coil = polyline([], palette.amber, { width: 3 });
    scene.add(base, head, coil);

    const graph = hudGraph(context, {
      title: "横方向のずれ（直近 4 秒）",
      min: -1,
      max: 1,
      xLabel: "時間",
    });
    const history = Array.from({ length: HISTORY }, () => 0);
    const offset = new Vector3();
    const velocity = new Vector3();
    const force = new Vector3();
    const anchor = new Vector3();
    let clock = 0;

    return {
      action(key) {
        if (key === "hit") {
          velocity.x += 5.5;
          velocity.z -= 1.5;
        }
      },
      update({ dt }) {
        const k = Number(params["stiffness"]);
        const c = Number(params["damping"]);
        const m = 1;
        const previousAnchor = anchor.clone();
        if (params["move"] === true) {
          clock += dt;
          // 素早く横に動いて止まる、を繰り返す台座
          const phase = clock % 3;
          const x =
            phase < 0.25
              ? -1.4 + (phase / 0.25) * 2.8
              : phase < 1.5
                ? 1.4
                : phase < 1.75
                  ? 1.4 - ((phase - 1.5) / 0.25) * 2.8
                  : -1.4;
          anchor.set(x, 0, 0);
        }
        base.position.copy(anchor);
        // 台座の移動は、標的から見ると逆向きのずれとして加わる
        if (dt > 0) {
          offset.sub(anchor.clone().sub(previousAnchor));
          const h = dt / SUBSTEPS;
          for (let step = 0; step < SUBSTEPS; step++) {
            force.copy(offset).multiplyScalar(-k).addScaledVector(velocity, -c);
            velocity.addScaledVector(force, h / m);
            offset.addScaledVector(velocity, h);
          }
        }
        head.position.copy(anchor).add(REST).add(offset);
        head.rotation.z = -offset.x * 0.35;

        const top = head.position.clone().add(new Vector3(0, -0.42, 0));
        const bottom = anchor.clone().add(new Vector3(0, 0.7, 0));
        const points: Vector3[] = [];
        const turns = 9;
        for (let index = 0; index <= 120; index++) {
          const u = index / 120;
          const angle = u * turns * Math.PI * 2;
          const center = bottom.clone().lerp(top, u);
          points.push(
            center.add(
              new Vector3(Math.cos(angle) * 0.16, 0, Math.sin(angle) * 0.16)
            )
          );
        }
        coil.setPoints(points);

        if (dt > 0) {
          history.shift();
          history.push(offset.x);
          graph.setSeries([
            {
              fn: (t) =>
                history[Math.min(HISTORY - 1, Math.floor(t * (HISTORY - 1)))] ??
                0,
              color: palette.cyan,
            },
          ]);
          graph.setMarker(1);
        }
        const zeta = c / (2 * Math.sqrt(k * m));
        context.readout("減衰比 ζ = c / 2√(km)", zeta.toFixed(2));
        context.readout(
          "固有振動数",
          `${(Math.sqrt(k / m) / (2 * Math.PI)).toFixed(2)} Hz`
        );
        context.caption(
          zeta < 1
            ? "ζ < 1（不足減衰）：行き過ぎて何度か揺れてから止まる。弾む UI や揺れる装飾に。"
            : zeta < 1.05
              ? "ζ ≈ 1（臨界減衰）：揺れずに最短で止まる。"
              : "ζ > 1（過減衰）：揺れないが、ゆっくりとしか戻らない。"
        );
      },
    };
  },
};
