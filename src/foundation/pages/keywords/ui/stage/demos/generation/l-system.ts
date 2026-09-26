import { Box3, Group, Quaternion, Vector3 } from "three";
import { palette, pointCloud, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

type Rule = { to: string; chance: number };
type Preset = {
  label: string;
  axiom: string;
  rules: Record<string, Rule[]>;
  angle: number;
  iterations: number;
  maxIterations: number;
  /** 描き始めの向き（上向きか下向きか）。 */
  down?: boolean;
  colors: [string, string];
  leaves?: boolean;
  /** 前進するたびに向きをランダムに振る角度（度）。稲妻のぎざぎざ用。 */
  wiggle?: number;
};

const PRESETS: Record<string, Preset> = {
  tree: {
    label: "3D の木",
    axiom: "X",
    rules: {
      X: [{ to: "F[&+X]////[&+X]////[&+X]FX", chance: 1 }],
      F: [{ to: "FF", chance: 1 }],
    },
    angle: 32,
    iterations: 5,
    maxIterations: 6,
    colors: ["#6b4a33", "#9fd37a"],
    leaves: true,
  },
  fern: {
    label: "シダ（2D）",
    axiom: "X",
    rules: {
      X: [{ to: "F+[[X]-X]-F[-FX]+X", chance: 1 }],
      F: [{ to: "FF", chance: 1 }],
    },
    angle: 25,
    iterations: 5,
    maxIterations: 6,
    colors: ["#3f7d3a", "#b7e07a"],
  },
  lightning: {
    label: "稲妻（確率つき）",
    axiom: "F",
    rules: {
      F: [
        { to: "F[+F]F", chance: 0.25 },
        { to: "F[-F]F", chance: 0.25 },
        { to: "F[&F]F", chance: 0.15 },
        { to: "FF", chance: 0.35 },
      ],
    },
    angle: 32,
    iterations: 5,
    maxIterations: 6,
    down: true,
    colors: ["#9fdcff", "#ffffff"],
    wiggle: 26,
  },
  koch: {
    label: "コッホ雪片",
    axiom: "F--F--F",
    rules: { F: [{ to: "F+F--F+F", chance: 1 }] },
    angle: 60,
    iterations: 3,
    maxIterations: 5,
    colors: ["#9fb7ff", "#e0e8ff"],
  },
};

/** 記号列を書き換える。確率つきの規則は、乱数で 1 つを選ぶ。 */
function rewrite(preset: Preset, iterations: number, random: () => number) {
  let text = preset.axiom;
  for (let n = 0; n < iterations; n++) {
    let next = "";
    for (const symbol of text) {
      const rules = preset.rules[symbol];
      if (!rules) {
        next += symbol;
        continue;
      }
      let pick = random();
      let chosen = rules[0]?.to ?? symbol;
      for (const rule of rules) {
        pick -= rule.chance;
        if (pick <= 0) {
          chosen = rule.to;
          break;
        }
      }
      next += chosen;
    }
    text = next;
    if (text.length > 400_000) {
      break;
    }
  }
  return text;
}

type Segment = { from: Vector3; to: Vector3; depth: number };

/** タートル：記号を 1 つずつ読み、前進・回転・枝分かれ（[ ]）を実行する。 */
function interpret(
  text: string,
  angleDeg: number,
  jitter: number,
  down: boolean,
  random: () => number,
  wiggle = 0
) {
  const segmentsOut: Segment[] = [];
  const tips: Vector3[] = [];
  let position = new Vector3();
  let orientation = new Quaternion();
  if (down) {
    orientation.setFromAxisAngle(new Vector3(0, 0, 1), Math.PI);
  }
  let depth = 0;
  const stack: { position: Vector3; orientation: Quaternion; depth: number }[] =
    [];
  const turn = (axis: Vector3, sign: number) => {
    const angle =
      ((angleDeg + (random() - 0.5) * 2 * jitter * angleDeg) * Math.PI * sign) /
      180;
    orientation.multiply(new Quaternion().setFromAxisAngle(axis, angle));
  };
  const up = new Vector3(0, 1, 0);
  const X = new Vector3(1, 0, 0);
  const Z = new Vector3(0, 0, 1);
  for (let index = 0; index < text.length; index++) {
    const symbol = text.charAt(index);
    switch (symbol) {
      case "F": {
        // ぎざぎざ：進む向きだけを一時的に振る（枝の向きは変えない）
        const heading = orientation.clone();
        if (wiggle > 0) {
          heading.multiply(
            new Quaternion().setFromAxisAngle(
              Z,
              ((random() - 0.5) * 2 * wiggle * Math.PI) / 180
            )
          );
          heading.multiply(
            new Quaternion().setFromAxisAngle(
              X,
              ((random() - 0.5) * 2 * wiggle * Math.PI) / 180
            )
          );
        }
        const next = position.clone().add(up.clone().applyQuaternion(heading));
        segmentsOut.push({ from: position, to: next, depth });
        position = next;
        break;
      }
      case "+": {
        turn(Z, 1);
        break;
      }
      case "-": {
        turn(Z, -1);
        break;
      }
      case "&": {
        turn(X, 1);
        break;
      }
      case "^": {
        turn(X, -1);
        break;
      }
      case "/": {
        turn(up, 1);
        break;
      }
      case "\\": {
        turn(up, -1);
        break;
      }
      case "[": {
        stack.push({
          position: position.clone(),
          orientation: orientation.clone(),
          depth,
        });
        depth++;
        break;
      }
      case "]": {
        if (text[index - 1] !== "]") {
          tips.push(position.clone());
        }
        const state = stack.pop();
        if (state) {
          ({ position, orientation, depth } = state);
        }
        break;
      }
      default: {
        break;
      }
    }
  }
  return { segments: segmentsOut, tips };
}

export const demo: DemoModule = {
  alt: "文字列の書き換えをくり返して、木やシダ、稲妻のような枝分かれした形を作る L システムのデモ。たとえば「X → F[&+X]////[&+X]…」のような規則を何回か当てはめると、文字列がどんどん長くなる。できた文字列を、F は前へ進んで線を引く、+ − は曲がる、[ ] は分かれ道の記録と戻り、というように亀（タートル）の動きとして読むと、自己相似な枝分かれが描ける。確率つきの規則にすると、毎回少しずつ違う形になる。",
  camera: { position: [0, 2.6, 8.5], target: [0, 2.2, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "preset",
      label: "規則",
      value: "tree",
      options: Object.entries(PRESETS).map(([value, preset]) => ({
        value,
        label: preset.label,
      })),
    },
    {
      type: "range",
      key: "iterations",
      label: "書き換えの回数",
      min: 1,
      max: 6,
      step: 1,
      value: 5,
    },
    {
      type: "range",
      key: "angle",
      label: "曲がる角度（度）",
      min: 5,
      max: 90,
      step: 1,
      value: 32,
    },
    {
      type: "range",
      key: "jitter",
      label: "角度のばらつき",
      min: 0,
      max: 0.6,
      step: 0.02,
      value: 0.15,
    },
    {
      type: "toggle",
      key: "grow",
      label: "文字列の順に描いていく",
      value: true,
    },
    { type: "button", key: "reseed", label: "乱数を変える" },
  ],
  legend: [
    { color: "#6b4a33", label: "F：前へ進んで線を引く" },
    { color: palette.lime, label: "枝先（] で戻る直前の位置）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const group = new Group();
    scene.add(group);
    // 枝の深さごとに線の太さを変える（幹は太く、枝先は細く）
    const widths = [5, 3.5, 2.4, 1.6, 1.1];
    const layers = widths.map((width) => {
      const line = segments([], "#6b4a33", { width });
      group.add(line);
      return line;
    });
    const leaves = pointCloud(20_000, { size: 10, color: palette.lime });
    group.add(leaves);

    let seed = 3;
    let signature = "";
    let presetUsed = "";
    let built: { segments: Segment[]; tips: Vector3[]; length: number } = {
      segments: [],
      tips: [],
      length: 0,
    };
    let grow = 0;
    let flicker = 0;

    const build = () => {
      const preset = PRESETS[String(params["preset"])] ?? PRESETS["tree"];
      if (!preset) {
        return;
      }
      const random = rng(seed);
      const iterations = Math.min(
        Number(params["iterations"]),
        preset.maxIterations
      );
      const text = rewrite(preset, iterations, random);
      const result = interpret(
        text,
        Number(params["angle"]),
        Number(params["jitter"]),
        preset.down === true,
        random,
        preset.wiggle ?? 0
      );
      // 大きさをそろえる：高さ 4.2 に収めて、根元（稲妻は上端）を決まった位置に置く
      const box = new Box3();
      for (const segment of result.segments) {
        box.expandByPoint(segment.from).expandByPoint(segment.to);
      }
      const size = box.getSize(new Vector3());
      const scale = 4.2 / Math.max(size.y, size.x * 0.6, 1e-6);
      const offset = new Vector3(
        -(box.min.x + box.max.x) / 2,
        preset.down === true ? -box.max.y : -box.min.y,
        -(box.min.z + box.max.z) / 2
      );
      const place = (point: Vector3) =>
        point
          .clone()
          .add(offset)
          .multiplyScalar(scale)
          .add(new Vector3(0, preset.down === true ? 4.6 : 0.05, 0));
      built = {
        segments: result.segments.map((segment) => ({
          from: place(segment.from),
          to: place(segment.to),
          depth: segment.depth,
        })),
        tips: preset.leaves === true ? result.tips.map(place) : [],
        length: text.length,
      };
      for (const layer of layers) {
        layer.material.color.set(preset.colors[0]);
      }
      leaves.visible = preset.leaves === true;
      context.readout("文字列の長さ", `${text.length.toLocaleString()} 文字`);
      context.readout("線分", result.segments.length.toLocaleString());
      const rules = Object.entries(preset.rules)
        .map(([from, list]) =>
          list
            .map(
              (rule) =>
                `${from} → ${rule.to}${list.length > 1 ? `（${Math.round(rule.chance * 100)}%）` : ""}`
            )
            .join("、")
        )
        .join("、");
      context.readout("規則", `${preset.axiom} から ${rules}`);
      grow = params["grow"] === true ? 0 : 1;
    };

    return {
      action(key) {
        if (key === "reseed") {
          seed++;
          signature = "";
        }
      },
      update({ dt }) {
        const presetKey = String(params["preset"]);
        if (presetKey !== presetUsed) {
          presetUsed = presetKey;
          const preset = PRESETS[presetKey];
          if (preset) {
            context.setParam("angle", preset.angle);
            context.setParam("iterations", preset.iterations);
          }
        }
        const key = [
          presetKey,
          params["iterations"],
          params["angle"],
          params["jitter"],
          seed,
        ].join("|");
        if (key !== signature) {
          signature = key;
          build();
        }
        const preset = PRESETS[presetKey];
        grow = Math.min(1, grow + dt / 3.5);
        if (params["grow"] !== true) {
          grow = 1;
        }
        // 稲妻は、描き終えたら数秒ごとに打ち直す
        if (preset?.down === true && grow >= 1) {
          flicker += dt;
          if (flicker > 1.6) {
            flicker = 0;
            seed++;
          }
        }
        const visible = Math.floor(
          built.segments.length *
            (preset?.down === true ? Math.min(1, grow * 4) : grow)
        );
        const buckets: Vector3[][] = widths.map(() => []);
        for (let index = 0; index < visible; index++) {
          const segment = built.segments[index];
          if (segment) {
            buckets[Math.min(widths.length - 1, segment.depth)]?.push(
              segment.from,
              segment.to
            );
          }
        }
        for (const [index, layer] of layers.entries()) {
          layer.setPoints(buckets[index] ?? []);
          layer.visible = (buckets[index]?.length ?? 0) > 0;
        }
        const tipCount = Math.floor(built.tips.length * grow);
        for (let index = 0; index < tipCount; index++) {
          const tip = built.tips[index];
          if (tip) {
            leaves.positions.set([tip.x, tip.y, tip.z], index * 3);
          }
        }
        leaves.geometry.setDrawRange(0, tipCount);
        leaves.commit();
        group.rotation.y += dt * (presetKey === "tree" ? 0.25 : 0);
        if (presetKey !== "tree") {
          group.rotation.y = 0;
        }
        context.caption(
          presetKey === "lightning"
            ? "同じ F を、確率で違う規則に書き換える（確率つき L システム）。枝分かれの位置と向きが毎回変わるので、打つたびに違う形の稲妻になる。"
            : presetKey === "koch"
              ? "三角形の各辺を「F+F--F+F」（途中に山を 1 つ作る）に置き換えるだけで、回数を重ねるほど細かいぎざぎざの雪の結晶になる。規則が単純でも、くり返すと複雑な形になる例。"
              : "文字列を規則で書き換え、できた文字列を亀の動きとして読む。[ で今の位置と向きを覚え、] でそこへ戻るので、枝の途中から別の枝を伸ばせる。1 回の書き換えで、枝のどこにも同じ形が小さく入れ子になる（自己相似）。"
        );
      },
    };
  },
};
