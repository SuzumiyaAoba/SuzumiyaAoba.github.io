import {
  Color,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Vector3,
} from "three";
import { crowd } from "../../agents";
import { TAU, arrow, palette, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

type V2 = { x: number; y: number };
type Line = { point: V2; direction: V2 };

const RADIUS = 0.28;
const MAX_SPEED = 1.3;
const NEIGHBOR = 3;
const MAX_NEIGHBORS = 8;
const STEP = 1 / 60;
const EPSILON = 1e-5;
/** 速度の図を描くときの拡大率（1 m/s を何 m で描くか）。 */
const VELOCITY_SCALE = 0.9;

const det = (a: V2, b: V2) => a.x * b.y - a.y * b.x;
const dot = (a: V2, b: V2) => a.x * b.x + a.y * b.y;
const sub = (a: V2, b: V2) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: V2, b: V2) => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: V2, s: number) => ({ x: a.x * s, y: a.y * s });
const lengthOf = (a: V2) => Math.hypot(a.x, a.y);
const normalize = (a: V2) => {
  const length = lengthOf(a);
  return length > 0 ? scale(a, 1 / length) : { x: 0, y: 0 };
};

/** 1 本の直線の上で、ほかの半平面と速さの円を満たす範囲の中から最適な点を選ぶ（RVO2 の linearProgram1）。 */
function linearProgram1(
  lines: readonly Line[],
  lineNo: number,
  radius: number,
  optimal: V2,
  directionOpt: boolean
): V2 | null {
  const line = lines[lineNo];
  if (!line) {
    return null;
  }
  const dotProduct = dot(line.point, line.direction);
  const discriminant =
    dotProduct * dotProduct + radius * radius - dot(line.point, line.point);
  if (discriminant < 0) {
    return null;
  }
  const root = Math.sqrt(discriminant);
  let tLeft = -dotProduct - root;
  let tRight = -dotProduct + root;
  for (let i = 0; i < lineNo; i++) {
    const other = lines[i];
    if (!other) {
      continue;
    }
    const denominator = det(line.direction, other.direction);
    const numerator = det(other.direction, sub(line.point, other.point));
    if (Math.abs(denominator) <= EPSILON) {
      if (numerator < 0) {
        return null;
      }
      continue;
    }
    const t = numerator / denominator;
    if (denominator >= 0) {
      tRight = Math.min(tRight, t);
    } else {
      tLeft = Math.max(tLeft, t);
    }
    if (tLeft > tRight) {
      return null;
    }
  }
  if (directionOpt) {
    return add(
      line.point,
      scale(line.direction, dot(optimal, line.direction) > 0 ? tRight : tLeft)
    );
  }
  const t = dot(line.direction, sub(optimal, line.point));
  return add(
    line.point,
    scale(line.direction, Math.min(tRight, Math.max(tLeft, t)))
  );
}

/** すべての半平面を満たし、望む速度に最も近い速度を求める。失敗した直線の番号も返す。 */
function linearProgram2(
  lines: readonly Line[],
  radius: number,
  optimal: V2,
  directionOpt: boolean
) {
  let result: V2;
  if (directionOpt) {
    result = scale(optimal, radius);
  } else if (dot(optimal, optimal) > radius * radius) {
    result = scale(normalize(optimal), radius);
  } else {
    result = optimal;
  }
  for (const [i, line] of lines.entries()) {
    if (det(line.direction, sub(line.point, result)) > 0) {
      const next = linearProgram1(lines, i, radius, optimal, directionOpt);
      if (!next) {
        return { result, fail: i };
      }
      result = next;
    }
  }
  return { result, fail: lines.length };
}

/** 全部は満たせないとき、半平面からのはみ出しが最小になる速度を選ぶ（linearProgram3）。 */
function linearProgram3(
  lines: readonly Line[],
  begin: number,
  radius: number,
  start: V2
) {
  let result = start;
  let distance = 0;
  for (let i = begin; i < lines.length; i++) {
    const line = lines[i];
    if (!line || det(line.direction, sub(line.point, result)) <= distance) {
      continue;
    }
    const projected: Line[] = [];
    for (let j = 0; j < i; j++) {
      const other = lines[j];
      if (!other) {
        continue;
      }
      const determinant = det(line.direction, other.direction);
      let point: V2;
      if (Math.abs(determinant) <= EPSILON) {
        if (dot(line.direction, other.direction) > 0) {
          continue;
        }
        point = scale(add(line.point, other.point), 0.5);
      } else {
        point = add(
          line.point,
          scale(
            line.direction,
            det(other.direction, sub(line.point, other.point)) / determinant
          )
        );
      }
      projected.push({
        point,
        direction: normalize(sub(other.direction, line.direction)),
      });
    }
    const { result: candidate, fail } = linearProgram2(
      projected,
      radius,
      { x: -line.direction.y, y: line.direction.x },
      true
    );
    if (fail >= projected.length) {
      result = candidate;
    }
    distance = det(line.direction, sub(line.point, result));
  }
  return result;
}

type Agent = {
  position: V2;
  velocity: V2;
  goal: V2;
  home: V2;
  group: number;
  lines: Line[];
  preferred: V2;
};

/** 相手 1 体について、ORCA の半平面（ぶつからない速度の側）を作る。 */
function orcaLine(self: Agent, other: Agent, horizon: number): Line {
  const relativePosition = sub(other.position, self.position);
  const relativeVelocity = sub(self.velocity, other.velocity);
  const distanceSq = dot(relativePosition, relativePosition);
  const combined = RADIUS * 2;
  let direction: V2;
  let u: V2;
  if (distanceSq > combined * combined) {
    // 相対速度から、切り取った円錐（速度障害物）のふちまでの最短のずれ u を求める
    const w = sub(relativeVelocity, scale(relativePosition, 1 / horizon));
    const wLengthSq = dot(w, w);
    const dot1 = dot(w, relativePosition);
    if (dot1 < 0 && dot1 * dot1 > combined * combined * wLengthSq) {
      const wLength = Math.sqrt(wLengthSq);
      const unit = scale(w, 1 / wLength);
      direction = { x: unit.y, y: -unit.x };
      u = scale(unit, combined / horizon - wLength);
    } else {
      const leg = Math.sqrt(distanceSq - combined * combined);
      // 相対速度が円錐の左右どちらの脚に近いかで、境目の向きを決める
      direction =
        det(relativePosition, w) > 0
          ? scale(
              {
                x: relativePosition.x * leg - relativePosition.y * combined,
                y: relativePosition.x * combined + relativePosition.y * leg,
              },
              1 / distanceSq
            )
          : scale(
              {
                x: relativePosition.x * leg + relativePosition.y * combined,
                y: -relativePosition.x * combined + relativePosition.y * leg,
              },
              -1 / distanceSq
            );
      u = sub(
        scale(direction, dot(relativeVelocity, direction)),
        relativeVelocity
      );
    }
  } else {
    // すでに重なっている：次の 1 ステップで離れる速度を求める
    const w = sub(relativeVelocity, scale(relativePosition, 1 / STEP));
    const wLength = lengthOf(w);
    const unit = scale(w, 1 / Math.max(1e-9, wLength));
    direction = { x: unit.y, y: -unit.x };
    u = scale(unit, combined / STEP - wLength);
  }
  // 相手と半分ずつ避け合う（相互）ので、ずれの半分だけ動かす
  return { point: add(self.velocity, scale(u, 0.5)), direction };
}

type Scenario = "circle" | "cross";

function makeAgents(scenario: Scenario): Agent[] {
  const agents: Agent[] = [];
  const create = (home: V2, goal: V2, group: number) =>
    agents.push({
      position: { ...home },
      velocity: { x: 0, y: 0 },
      goal,
      home,
      group,
      lines: [],
      preferred: { x: 0, y: 0 },
    });
  if (scenario === "circle") {
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU;
      const home = { x: Math.cos(angle) * 4, y: Math.sin(angle) * 3.6 };
      create(home, { x: -home.x, y: -home.y }, i % 2);
    }
  } else {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const left = { x: -6 + row * 0.7, y: -1.4 + col * 0.7 };
        create(left, { x: left.x + 10.5, y: left.y }, 0);
        const bottom = { x: -1.4 + col * 0.7, y: 4.2 - row * 0.7 };
        create(bottom, { x: bottom.x, y: bottom.y - 8.4 }, 1);
      }
    }
  }
  return agents;
}

export const demo: DemoModule = {
  alt: "大勢のキャラクターが、互いに相手も避けてくれることを前提に、ぶつからない速度を選ぶ ORCA（最適相互衝突回避）のデモ。相手ごとに「この先数秒ぶつからない速度」の範囲を半平面として求め、全部の半平面を満たす速度のうち、行きたい向きの速度に最も近いものを選ぶ。避ける量は相手と半分ずつ分け合うので、両方が大きく避けて揺れることがない。避けないとキャラクターが重なり、単純な反発力では押し合って渋滞する。白く選んだ 1 体については、相手ごとの半平面の境目の線と、選んだ速度を表示する。",
  camera: { position: [0, 10.5, 7.5], target: [0, 0, 0.3], fov: 42 },
  controls: [
    {
      type: "select",
      key: "method",
      label: "避け方",
      value: "orca",
      options: [
        { value: "none", label: "避けない" },
        { value: "repel", label: "近い相手から離れる力" },
        { value: "orca", label: "ORCA" },
      ],
    },
    {
      type: "select",
      key: "scenario",
      label: "場面",
      value: "circle",
      options: [
        { value: "circle", label: "円の反対側へ入れ替わる" },
        { value: "cross", label: "2 つの群れが十字に交差" },
      ],
    },
    {
      type: "range",
      key: "horizon",
      label: "先読みの時間 τ（秒）",
      min: 0.5,
      max: 5,
      step: 0.1,
      value: 2,
    },
    {
      type: "toggle",
      key: "lines",
      label: "1 体の速度の制約（半平面）を表示",
      value: true,
    },
  ],
  legend: [
    { color: palette.sky, label: "グループ A" },
    { color: palette.amber, label: "グループ B" },
    { color: palette.coral, label: "ほかと重なっている" },
    {
      color: palette.violet,
      label: "半平面の境目（線の左がぶつからない速度）",
    },
    { color: palette.lime, label: "選んだ速度（灰色は行きたい速度）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const maxAgents = 40;
    const discs = new InstancedMesh(
      new CylinderGeometry(RADIUS, RADIUS, 0.18, 24),
      standard("#ffffff", { roughness: 0.5 }),
      maxAgents
    );
    discs.castShadow = true;
    discs.frustumCulled = false;
    const heads = crowd(maxAgents, palette.ink, { emissive: 0.3 });
    scene.add(discs, heads);
    const constraint = segments([], palette.violet, {
      width: 2,
      opacity: 0.85,
    });
    scene.add(constraint);
    const preferredArrow = arrow(palette.muted, { overlay: true });
    const chosenArrow = arrow(palette.lime, { overlay: true, radius: 0.03 });
    scene.add(preferredArrow, chosenArrow);

    const colors = [new Color(palette.sky), new Color(palette.amber)];
    const coral = new Color(palette.coral);
    const white = new Color(palette.ink);
    let agents: Agent[] = [];
    let scenario = "";
    let accumulator = 0;
    let contacts = 0;
    let hold = 0;
    const matrix = new Matrix4();
    const position = new Vector3();
    const velocity = new Vector3();

    const step = (method: string, horizon: number) => {
      for (const agent of agents) {
        const toGoal = sub(agent.goal, agent.position);
        const distance = lengthOf(toGoal);
        agent.preferred =
          distance > 0.05
            ? scale(toGoal, Math.min(MAX_SPEED, distance * 2) / distance)
            : { x: 0, y: 0 };
      }
      const next = agents.map((agent) => {
        if (method === "none") {
          return agent.preferred;
        }
        if (method === "repel") {
          let push = { ...agent.preferred };
          for (const other of agents) {
            if (other === agent) {
              continue;
            }
            const away = sub(agent.position, other.position);
            const d = lengthOf(away);
            if (d < 1.2 && d > 1e-6) {
              push = add(push, scale(away, ((1.2 - d) * 3) / d));
            }
          }
          return lengthOf(push) > MAX_SPEED
            ? scale(normalize(push), MAX_SPEED)
            : push;
        }
        // 近い順に最大 MAX_NEIGHBORS 体だけを相手にする（RVO2 の maxNeighbors）
        agent.lines = agents
          .filter(
            (other) =>
              other !== agent &&
              lengthOf(sub(other.position, agent.position)) < NEIGHBOR
          )
          .toSorted(
            (a, b) =>
              lengthOf(sub(a.position, agent.position)) -
              lengthOf(sub(b.position, agent.position))
          )
          .slice(0, MAX_NEIGHBORS)
          .map((other) => orcaLine(agent, other, horizon));
        const { result, fail } = linearProgram2(
          agent.lines,
          MAX_SPEED,
          agent.preferred,
          false
        );
        return fail < agent.lines.length
          ? linearProgram3(agent.lines, fail, MAX_SPEED, result)
          : result;
      });
      for (const [i, agent] of agents.entries()) {
        agent.velocity = next[i] ?? agent.velocity;
        agent.position = add(agent.position, scale(agent.velocity, STEP));
      }
    };

    return {
      update({ dt }) {
        const nextScenario = String(params["scenario"]);
        if (nextScenario !== scenario) {
          scenario = nextScenario;
          agents = makeAgents(scenario === "cross" ? "cross" : "circle");
          hold = 0;
        }
        const method = String(params["method"]);
        const horizon = Number(params["horizon"]);
        accumulator += dt;
        while (accumulator >= STEP) {
          accumulator -= STEP;
          step(method, horizon);
        }
        // 全員が着いたら、行き先を入れ替えてくり返す
        const arrived = agents.filter(
          (agent) => lengthOf(sub(agent.goal, agent.position)) < 0.15
        ).length;
        if (arrived === agents.length) {
          hold += dt;
          if (hold > 1) {
            hold = 0;
            for (const agent of agents) {
              if (scenario === "cross") {
                agent.position = { ...agent.home };
                agent.velocity = { x: 0, y: 0 };
              } else {
                const { goal } = agent;
                agent.goal = agent.home;
                agent.home = goal;
              }
            }
          }
        }
        contacts = 0;
        const touching = agents.map(() => false);
        for (let i = 0; i < agents.length; i++) {
          for (let j = i + 1; j < agents.length; j++) {
            const a = agents[i];
            const b = agents[j];
            if (
              a &&
              b &&
              lengthOf(sub(a.position, b.position)) < RADIUS * 2 * 0.98
            ) {
              contacts++;
              touching[i] = true;
              touching[j] = true;
            }
          }
        }
        for (const [i, agent] of agents.entries()) {
          position.set(agent.position.x, 0.09, agent.position.y);
          matrix.makeTranslation(position.x, position.y, position.z);
          discs.setMatrixAt(i, matrix);
          const selected = i === 0 && params["lines"] === true;
          discs.setColorAt(
            i,
            touching[i] === true
              ? coral
              : selected
                ? white
                : (colors[agent.group] ?? white)
          );
          velocity.set(agent.velocity.x, 0, agent.velocity.y);
          heads.set(i, position.clone().setY(0.25), velocity, 0.7);
        }
        discs.count = agents.length;
        heads.count = agents.length;
        discs.instanceMatrix.needsUpdate = true;
        if (discs.instanceColor) {
          discs.instanceColor.needsUpdate = true;
        }
        heads.commit();

        const [first] = agents;
        const showLines =
          params["lines"] === true && method === "orca" && first !== undefined;
        constraint.visible = showLines;
        preferredArrow.visible = showLines;
        chosenArrow.visible = showLines;
        if (showLines) {
          // 選んだ 1 体の位置を速度空間の原点として、半平面の境目を描く
          const origin = new Vector3(first.position.x, 0.3, first.position.y);
          const points: Vector3[] = [];
          for (const line of first.lines) {
            const p = add(line.point, scale(line.direction, -1.3));
            const q = add(line.point, scale(line.direction, 1.3));
            points.push(
              origin
                .clone()
                .add(new Vector3(p.x, 0, p.y).multiplyScalar(VELOCITY_SCALE)),
              origin
                .clone()
                .add(new Vector3(q.x, 0, q.y).multiplyScalar(VELOCITY_SCALE))
            );
          }
          constraint.setPoints(points);
          constraint.visible = points.length > 0;
          preferredArrow.set(
            origin,
            new Vector3(first.preferred.x, 0, first.preferred.y).multiplyScalar(
              VELOCITY_SCALE
            )
          );
          chosenArrow.set(
            origin,
            new Vector3(first.velocity.x, 0, first.velocity.y).multiplyScalar(
              VELOCITY_SCALE
            )
          );
        }
        context.readout("重なっている組", `${contacts}`);
        context.readout("着いた人数", `${arrived} / ${agents.length}`);
        context.caption(
          method === "none"
            ? "全員が目的地へまっすぐ進むだけなので、真ん中で重なり合ってすり抜ける（赤）。実際のゲームなら押し合ってはまり込む。"
            : method === "repel"
              ? "近い相手から離れる力を足すだけの方法。重なりは減るが、真ん中で押し合って渋滞し、左右に揺れながら進む。相手がどう動くかを考えていないため。"
              : "ORCA：相手ごとに、先読みの時間 τ の間ぶつからない速度の範囲（半平面、紫の線の左側）を求め、全部を満たす速度のうち、行きたい速度（灰色）に最も近いもの（黄緑）を選ぶ。避ける量を相手と半分ずつ分け合うので、流れるようにすれ違う。"
        );
      },
      dispose() {
        discs.dispose();
      },
    };
  },
};
