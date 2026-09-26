import { BoxGeometry, CapsuleGeometry, Mesh, Vector3 } from "three";
import { palette, polyline, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";

const GRAVITY = 20;
const JUMP_SPEED = 9;
const RUN_SPEED = 3.2;
const TRACK = 10;
const IDEAL_APEX = (JUMP_SPEED * JUMP_SPEED) / (2 * GRAVITY);
const TIMELINE_SECONDS = 0.5;

type Body = {
  x: number;
  y: number;
  vy: number;
  apex: number;
  lastApex: number;
};
type Lane = {
  key: "variable" | "fixed" | "interpolated";
  label: string;
  color: string;
  z: number;
  current: Body;
  previous: Body;
  mesh: Mesh;
  apexLine: ReturnType<typeof polyline>;
};

const freshBody = (): Body => ({
  x: -TRACK / 2,
  y: 0,
  vy: JUMP_SPEED,
  apex: 0,
  lastApex: IDEAL_APEX,
});

/** 半陰的オイラー法で 1 ステップ。着地したらすぐにまた跳ぶ。 */
function step(body: Body, dt: number) {
  body.vy -= GRAVITY * dt;
  body.y += body.vy * dt;
  body.x += RUN_SPEED * dt;
  if (body.x > TRACK / 2) {
    body.x -= TRACK;
  }
  body.apex = Math.max(body.apex, body.y);
  if (body.y <= 0) {
    body.y = 0;
    body.vy = JUMP_SPEED;
    body.lastApex = body.apex;
    body.apex = 0;
  }
}

export const demo: DemoModule = {
  alt: "同じジャンプを 3 つの方法で時間を進めて比べるデモ。描画 1 回ごとの経過時間でそのまま物理を進めると、フレームレートの揺れでジャンプの高さが毎回変わる。物理を決まった刻み（固定タイムステップ）で進めると高さは毎回同じになるが、描画と物理の刻みがずれてカクつく。前後 2 回の物理の結果を補間して描くと、同じ結果のままなめらかに動く。右下の図は、描画（上）と物理の更新（下）のタイミング。",
  camera: { position: [-2.5, 6.5, 11], target: [0, 1, 0] },
  controls: [
    {
      type: "range",
      key: "fps",
      label: "描画のフレームレート",
      min: 10,
      max: 144,
      step: 1,
      value: 45,
      format: (value) => `${value} fps`,
    },
    {
      type: "toggle",
      key: "jitter",
      label: "フレーム時間のばらつき・引っかかり",
      value: true,
    },
    {
      type: "range",
      key: "hz",
      label: "物理の更新回数（固定）",
      min: 10,
      max: 120,
      step: 1,
      value: 30,
      format: (value) => `${value} 回/秒`,
    },
    {
      type: "range",
      key: "speed",
      label: "再生速度",
      min: 0.25,
      max: 1,
      step: 0.05,
      value: 0.5,
      hint: "ゆっくり再生すると、カクつきが見やすくなります。",
    },
  ],
  legend: [
    { color: palette.coral, label: "可変タイムステップ" },
    { color: palette.amber, label: "固定タイムステップ（補間なし）" },
    { color: palette.cyan, label: "固定タイムステップ + 補間" },
    { color: palette.ink, label: "本来のジャンプの高さ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(4);
    const laneSpecs = [
      { key: "variable", label: "可変", color: palette.coral, z: -2.2 },
      { key: "fixed", label: "固定", color: palette.amber, z: 0 },
      {
        key: "interpolated",
        label: "固定 + 補間",
        color: palette.cyan,
        z: 2.2,
      },
    ] as const;
    const lanes: Lane[] = laneSpecs.map((spec) => {
      const mesh = new Mesh(
        new CapsuleGeometry(0.28, 0.5, 8, 16),
        standard(spec.color, { roughness: 0.4 })
      );
      mesh.castShadow = true;
      const track = new Mesh(
        new BoxGeometry(TRACK + 1, 0.1, 1.2),
        standard("#2c3544", { roughness: 0.8 })
      );
      track.position.set(0, -0.05, spec.z);
      track.receiveShadow = true;
      const ideal = polyline(
        [
          new Vector3(-TRACK / 2 - 0.5, IDEAL_APEX + 0.53, spec.z),
          new Vector3(TRACK / 2 + 0.5, IDEAL_APEX + 0.53, spec.z),
        ],
        palette.ink,
        { width: 1.2, dashed: true, opacity: 0.6 }
      );
      const apexLine = polyline([], spec.color, { width: 3 });
      scene.add(mesh, track, ideal, apexLine);
      return {
        ...spec,
        current: freshBody(),
        previous: freshBody(),
        mesh,
        apexLine,
      };
    });

    // 右下：描画（上段）と物理の更新（下段）のタイミング
    const figure = document.createElement("figure");
    figure.className = "keyword-stage-graph";
    const caption = document.createElement("figcaption");
    caption.textContent = "描画（上）と物理の更新（下）のタイミング";
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 120;
    canvas.style.width = "200px";
    canvas.style.height = "60px";
    figure.append(caption, canvas);
    context.hud(figure);
    const renderTicks: number[] = [];
    const physicsTicks: number[] = [];
    const drawTimeline = (now: number) => {
      const context2d = canvas.getContext("2d");
      if (!context2d) {
        return;
      }
      context2d.clearRect(0, 0, canvas.width, canvas.height);
      const toX = (t: number) =>
        canvas.width - ((now - t) / TIMELINE_SECONDS) * canvas.width;
      context2d.fillStyle = "#e8eef6";
      for (const t of renderTicks) {
        context2d.fillRect(toX(t) - 2, 10, 4, 40);
      }
      context2d.fillStyle = palette.amber;
      for (const t of physicsTicks) {
        context2d.fillRect(toX(t) - 2, 70, 4, 40);
      }
    };

    let simTime = 0;
    let frameClock = 0;
    let nextFrame = 0;
    let accumulator = 0;

    return {
      update({ dt }) {
        const speed = Number(params["speed"]);
        simTime += dt * speed;
        const fps = Number(params["fps"]);
        const fixedDt = 1 / Number(params["hz"]);
        // 描画のフレームが来たときだけ、ゲームの 1 フレーム分を処理する（それ以外は前の絵のまま）
        while (simTime >= nextFrame) {
          let frameDt = 1 / fps;
          if (params["jitter"] === true) {
            frameDt *= 0.6 + random() * 0.8;
            if (random() < 0.04) {
              frameDt *= 4; // ときどき大きな引っかかり
            }
          }
          frameClock = nextFrame;
          nextFrame += frameDt;
          renderTicks.push(frameClock);

          const [variable] = lanes;
          if (variable) {
            // 1. 可変：フレームの経過時間でそのまま進める
            step(variable.current, frameDt);
          }
          // 2・3. 固定：たまった時間を決まった刻みで消化する
          accumulator += frameDt;
          let steps = 0;
          while (accumulator >= fixedDt && steps < 10) {
            accumulator -= fixedDt;
            steps++;
            physicsTicks.push(frameClock - accumulator);
            for (const lane of lanes.slice(1)) {
              Object.assign(lane.previous, lane.current);
              step(lane.current, fixedDt);
            }
          }
          const alpha = accumulator / fixedDt;
          for (const lane of lanes) {
            let { x, y } = lane.current;
            if (lane.key === "interpolated") {
              // 前回と今回の物理の結果を、余った時間の割合で補間して描く
              const wrapped = lane.current.x < lane.previous.x;
              const previousX = wrapped
                ? lane.previous.x - TRACK
                : lane.previous.x;
              x = previousX + (lane.current.x - previousX) * alpha;
              y = lane.previous.y + (lane.current.y - lane.previous.y) * alpha;
            }
            lane.mesh.position.set(x, y + 0.53, lane.z);
            const apexY = lane.current.lastApex + 0.53;
            lane.apexLine.setPoints([
              new Vector3(-TRACK / 2 - 0.5, apexY, lane.z + 0.35),
              new Vector3(-TRACK / 2 + 0.6, apexY, lane.z + 0.35),
            ]);
          }
        }
        while (
          renderTicks.length > 0 &&
          (renderTicks[0] ?? 0) < simTime - TIMELINE_SECONDS
        ) {
          renderTicks.shift();
        }
        while (
          physicsTicks.length > 0 &&
          (physicsTicks[0] ?? 0) < simTime - TIMELINE_SECONDS
        ) {
          physicsTicks.shift();
        }
        drawTimeline(simTime);
        for (const lane of lanes) {
          context.readout(
            `${lane.label}の高さ`,
            `${((lane.current.lastApex / IDEAL_APEX) * 100).toFixed(0)}%`
          );
        }
        context.caption(
          "可変（赤）はフレームの長さで物理の結果が変わり、引っかかるたびにジャンプの高さがぶれる。固定（黄）は毎回同じ高さだが、描画と物理のタイミングがずれてカクつく。固定 + 補間（青緑）は、結果は固定と同じまま、描画だけを前後の物理の間で補ってなめらかにする。"
        );
      },
    };
  },
};
