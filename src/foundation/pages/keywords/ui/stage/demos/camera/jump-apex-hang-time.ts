import { Vector2, Vector3 } from "three";
import { palette, polyline, segments } from "../../kit";
import { courseView, PLAYER, Player, playerView } from "../../platformer";
import type { Block, PlayerOptions } from "../../platformer";
import type { DemoModule } from "../../types";

const FLOOR: readonly Block[] = [{ x: -30, y: -3, w: 60, h: 3 }];
const START_X = -6;
const STEP = 1 / 120;
const PRESS_STEP = 4;
const LOOP = 1.9;

type Arc = {
  points: Vector3[];
  apex: Vector3[];
  airtime: number;
  peak: number;
  nearApex: number;
};

/**
 * 同じ踏み切りから走り幅跳びをしたときの軌跡を、固定の刻みで最後まで計算する。
 * hold 秒だけジャンプボタンを押し続け、その後は離す。
 */
function simulate(
  options: PlayerOptions,
  hold: number,
  z: number,
  threshold: number
): Arc {
  const player = new Player(FLOOR, new Vector2(START_X, 0));
  player.velocity.x = PLAYER.run;
  const points: Vector3[] = [];
  const apex: Vector3[] = [];
  let takeoff = -1;
  let airtime = 0;
  let peak = 0;
  let nearApex = 0;
  for (let step = 0; step < LOOP / STEP; step++) {
    const pressed = step === PRESS_STEP;
    const held = takeoff < 0 || player.time - takeoff < hold;
    player.update(
      STEP,
      { move: 1, jumpPressed: pressed, jumpHeld: pressed || held },
      options
    );
    if (pressed) {
      takeoff = player.time;
    }
    const point = new Vector3(player.position.x, player.position.y, z);
    points.push(point);
    if (takeoff >= 0 && !player.onGround) {
      airtime += STEP;
      peak = Math.max(peak, player.position.y);
      if (Math.abs(player.velocity.y) < threshold) {
        nearApex += STEP;
        apex.push(point.clone().setY(point.y + PLAYER.height / 2));
      }
    }
  }
  return { points, apex, airtime, peak, nearApex };
}

const CONFIGS = [
  { key: "constant", label: "重力がずっと一定", color: palette.muted, z: -0.7 },
  { key: "fall", label: "落ちるときだけ重く", color: palette.sky, z: 0 },
  {
    key: "hang",
    label: "頂点でふわっと＋落ちるときは重く",
    color: palette.amber,
    z: 0.7,
  },
] as const;

export const demo: DemoModule = {
  alt: "ジャンプの頂点付近だけ重力を弱めて、少しの間ふわっと浮かせる調整のデモ。3 人が同じ速さで走って同時に跳ぶ。灰色は重力がずっと一定で、上りと下りが同じ形の放物線になり、ふわふわと重たい。青は落ちるときだけ重力を強めて、すばやく着地する。黄色はそれに加えて頂点付近で重力を弱めるので、一番高いところで一瞬とどまり、狙いを定めやすい。緑の点は頂点付近にいる間の位置。",
  camera: { position: [0, 3.2, 13], target: [0, 1.3, 0], orbit: false },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "range",
      key: "hang",
      label: "頂点付近の重力（黄）",
      min: 0.15,
      max: 1,
      step: 0.05,
      value: 0.4,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      type: "range",
      key: "threshold",
      label: "頂点付近とみなす上下の速さ",
      min: 0.5,
      max: 6,
      step: 0.1,
      value: 3,
      format: (value) => `${value.toFixed(1)} m/s`,
    },
    {
      type: "range",
      key: "fall",
      label: "落ちるときの重力（青・黄）",
      min: 1,
      max: 2.5,
      step: 0.05,
      value: 1.7,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      type: "range",
      key: "hold",
      label: "ボタンを押している長さ（青・黄）",
      min: 0.05,
      max: 0.6,
      step: 0.01,
      value: 0.6,
      format: (value) => `${Math.round(value * 1000)} ms`,
      hint: "短く押すと、そこで上昇を打ち切って低く跳びます（可変ジャンプ）。",
    },
  ],
  legend: [
    ...CONFIGS.map(({ color, label }) => ({ color, label })),
    { color: palette.lime, label: "頂点付近にいる間" },
  ],
  setup(context) {
    const { scene, params } = context;
    courseView(FLOOR, scene);
    const actors = CONFIGS.map((config) => {
      const avatar = playerView(config.color);
      scene.add(avatar);
      const arc = polyline([], config.color, { width: 2.5, opacity: 0.85 });
      scene.add(arc);
      const dots = segments([], palette.lime, { width: 5 });
      scene.add(dots);
      const ghost = new Player(FLOOR, new Vector2());
      return {
        ...config,
        avatar,
        arc,
        dots,
        ghost,
        result: null as Arc | null,
      };
    });

    let signature = "";
    let clock = 0;
    const rebuild = () => {
      const hang = Number(params["hang"]);
      const threshold = Number(params["threshold"]);
      const fall = Number(params["fall"]);
      const hold = Number(params["hold"]);
      for (const actor of actors) {
        let options: PlayerOptions = { fallMultiplier: 1 };
        let holdTime = LOOP;
        if (actor.key === "fall") {
          options = { fallMultiplier: fall, variableJump: 2.5 };
          holdTime = hold;
        } else if (actor.key === "hang") {
          options = {
            fallMultiplier: fall,
            variableJump: 2.5,
            apexHang: hang,
            apexThreshold: threshold,
          };
          holdTime = hold;
        }
        const result = simulate(options, holdTime, actor.z, threshold);
        actor.result = result;
        const lifted = result.points.map((point) =>
          point.clone().setY(point.y + PLAYER.height / 2)
        );
        actor.arc.setPoints(lifted);
        // 頂点付近の位置を、短い線分（点）として並べる
        const dotPoints: Vector3[] = [];
        for (const [index, point] of result.apex.entries()) {
          if (index % 3 === 0) {
            dotPoints.push(point, point.clone().setX(point.x + 0.04));
          }
        }
        actor.dots.visible = dotPoints.length > 0;
        if (dotPoints.length > 0) {
          actor.dots.setPoints(dotPoints);
        }
      }
    };

    return {
      update({ dt }) {
        const next = ["hang", "threshold", "fall", "hold"]
          .map((key) => String(params[key]))
          .join("|");
        if (next !== signature) {
          signature = next;
          rebuild();
          clock = 0;
        }
        clock = (clock + Math.max(0, dt)) % (LOOP + 0.6);
        const index = Math.min(
          Math.floor(clock / STEP),
          Math.floor(LOOP / STEP) - 1
        );
        for (const actor of actors) {
          const point = actor.result?.points[index];
          if (!point) {
            continue;
          }
          const previous =
            actor.result?.points[Math.max(0, index - 1)] ?? point;
          actor.ghost.position.set(point.x, point.y);
          actor.ghost.velocity.set(PLAYER.run, (point.y - previous.y) / STEP);
          actor.ghost.facing = 1;
          actor.avatar.update(actor.ghost);
          actor.avatar.position.z = actor.z;
        }
        for (const actor of actors) {
          const { result } = actor;
          if (result) {
            context.readout(
              actor.label,
              `滞空 ${result.airtime.toFixed(2)} s・高さ ${result.peak.toFixed(2)} m・頂点付近 ${result.nearApex.toFixed(2)} s`
            );
          }
        }
        context.caption(
          "灰色は上りと下りが同じ形の放物線で、頂点付近を一瞬で通り過ぎ、下りもゆっくりで重たく感じる。黄色は頂点付近（緑の点）で重力を弱めて少しとどまり、そのあと重い重力ですばやく降りる。頂点付近にいる時間は灰色の約 2 倍になり、空中で狙いを定めやすいのに、下りはきびきびして重たく感じない。"
        );
      },
    };
  },
};
