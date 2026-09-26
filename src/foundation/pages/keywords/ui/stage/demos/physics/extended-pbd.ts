import {
  BoxGeometry,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { palette, polyline, standard } from "../../kit";
import { ParticleSystem } from "../../pbd";
import type { DemoModule } from "../../types";

const SEGMENTS = 16;
const TOP = 5.2;
const SEGMENT_LENGTH = 0.14;
const CORD_MASS = 0.02;
const BALL_MASS = 2;
const GRAVITY = 9.81;

type Cord = {
  system: ParticleSystem;
  mode: "pbd" | "xpbd";
  x: number;
  line: ReturnType<typeof polyline>;
  ball: Mesh;
};

export const demo: DemoModule = {
  alt: "ゴムひもで吊るした 2 つのおもりで、PBD と XPBD（拡張位置ベース物理）を比べるデモ。左の PBD は、拘束の反復回数や時間刻みを変えるとゴムの硬さが変わってしまい、おもりの高さが大きく動く。右の XPBD は、硬さを「コンプライアンス（伸びやすさ）」という物理的な値で与えるので、反復回数や時間刻みを変えてもほぼ同じ高さで釣り合い、点線で示した理論上の位置に止まる。",
  camera: { position: [0, 3.2, 9], target: [0, 2.9, 0] },
  controls: [
    {
      type: "range",
      key: "iterations",
      label: "拘束の反復回数",
      min: 1,
      max: 50,
      step: 1,
      value: 10,
    },
    {
      type: "range",
      key: "substeps",
      label: "1 フレームの分割数",
      min: 1,
      max: 12,
      step: 1,
      value: 4,
    },
    {
      type: "range",
      key: "softness",
      label: "ゴムの柔らかさ",
      min: 0.2,
      max: 3,
      step: 0.05,
      value: 1,
      hint: "XPBD ではコンプライアンス（硬さの逆数）、PBD では 1 回の補正の割合に換算しています。",
    },
    { type: "button", key: "pull", label: "引っ張って離す" },
  ],
  legend: [
    { color: palette.amber, label: "PBD（反復回数で硬さが変わる）" },
    { color: palette.cyan, label: "XPBD（硬さが一定）" },
    { color: palette.ink, label: "理論上の釣り合いの位置" },
  ],
  setup(context) {
    const { scene, params } = context;
    const makeCord = (mode: "pbd" | "xpbd", x: number, color: string): Cord => {
      const system = new ParticleSystem(SEGMENTS + 1);
      for (let i = 0; i <= SEGMENTS; i++) {
        system.set(i, new Vector3(x, TOP - i * SEGMENT_LENGTH, 0));
        system.inverseMass[i] =
          i === 0 ? 0 : i === SEGMENTS ? 1 / BALL_MASS : 1 / CORD_MASS;
      }
      for (let i = 0; i < SEGMENTS; i++) {
        system.connect(i, i + 1);
      }
      const line = polyline([], color, { width: 4 });
      const ball = new Mesh(
        new SphereGeometry(0.32, 32, 20),
        standard(color, { roughness: 0.35, metalness: 0.2 })
      );
      ball.castShadow = true;
      const hook = new Mesh(
        new TorusGeometry(0.1, 0.03, 8, 20),
        standard("#9aa4b5", { metalness: 0.8, roughness: 0.3 })
      );
      hook.position.set(x, TOP + 0.08, 0);
      scene.add(line, ball, hook);
      return { system, mode, x, line, ball };
    };
    const cords = [
      makeCord("pbd", -1.6, palette.amber),
      makeCord("xpbd", 1.6, palette.cyan),
    ];
    const beam = new Mesh(
      new BoxGeometry(5.4, 0.18, 0.4),
      standard("#4a5568", { metalness: 0.5, roughness: 0.4 })
    );
    beam.position.set(0, TOP + 0.25, 0);
    beam.castShadow = true;
    scene.add(beam);
    const theory = polyline([], palette.ink, { width: 1.5, dashed: true });
    scene.add(theory);

    const pull = () => {
      for (const cord of cords) {
        for (let i = 1; i <= SEGMENTS; i++) {
          cord.system.set(
            i,
            new Vector3(cord.x, TOP - i * SEGMENT_LENGTH * 2.2, 0)
          );
        }
      }
    };
    pull();
    const position = new Vector3();

    return {
      action(key) {
        if (key === "pull") {
          pull();
        }
      },
      update({ dt }) {
        const iterations = Number(params["iterations"]);
        const substeps = Number(params["substeps"]);
        const softness = Number(params["softness"]);
        // XPBD：1 区間あたりのコンプライアンス（m/N）
        const compliance = softness * 0.0018;
        // PBD：1 回の補正の割合。反復 10 回・分割 4 のときに XPBD と近い見た目になるよう合わせた値
        const stiffness = Math.min(1, 0.087 / softness);
        if (dt > 0) {
          const h = dt / substeps;
          for (const cord of cords) {
            for (const constraint of cord.system.constraints) {
              constraint.compliance = compliance;
            }
            for (let s = 0; s < substeps; s++) {
              cord.system.predict(h, GRAVITY, 0.004);
              for (let iteration = 0; iteration < iterations; iteration++) {
                cord.system.solveDistances(h, cord.mode, stiffness);
              }
              cord.system.updateVelocities(h);
            }
          }
        }
        for (const cord of cords) {
          const points: Vector3[] = [];
          for (let i = 0; i <= SEGMENTS; i++) {
            points.push(cord.system.get(i, position).clone());
          }
          cord.line.setPoints(points);
          cord.system.get(SEGMENTS, position);
          cord.ball.position.set(position.x, position.y - 0.3, position.z);
        }
        // 理論値：各区間には（下にあるものの重さ）の張力がかかり、コンプライアンス × 張力だけ伸びる
        let theoryY = TOP;
        for (let i = 0; i < SEGMENTS; i++) {
          const massBelow = BALL_MASS + CORD_MASS * (SEGMENTS - 1 - i);
          theoryY -= SEGMENT_LENGTH + compliance * massBelow * GRAVITY;
        }
        theory.setPoints([
          new Vector3(0.6, theoryY - 0.3, 0),
          new Vector3(2.6, theoryY - 0.3, 0),
        ]);
        for (const cord of cords) {
          cord.system.get(SEGMENTS, position);
          context.readout(
            cord.mode === "pbd" ? "PBD の長さ" : "XPBD の長さ",
            `${(TOP - position.y).toFixed(2)} m`
          );
        }
        context.readout("理論値", `${(TOP - theoryY).toFixed(2)} m`);
        context.caption(
          "PBD は「1 回の補正で誤差の何割を直すか」で硬さを決めるので、反復を増やすほど、刻みを細かくするほど硬くなる。XPBD は拘束ごとに累積した力 λ とコンプライアンスを使って補正量を決めるので、硬さが反復回数や時間刻みに左右されない。"
        );
      },
    };
  },
};
