import {
  BoxGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

const N = 16;
const GAP = 0.62;

type Step = { values: number[]; edges: [number, number][]; note: string };

/** ヒリスとスティール：ステップ k で、2^k 前の値を全員が同時に足す。 */
function hillisSteele(input: readonly number[]) {
  const steps: Step[] = [{ values: [...input], edges: [], note: "元の値" }];
  let values = [...input];
  for (let offset = 1; offset < N; offset *= 2) {
    const next = [...values];
    const edges: [number, number][] = [];
    for (let i = offset; i < N; i++) {
      next[i] = (values[i] ?? 0) + (values[i - offset] ?? 0);
      edges.push([i - offset, i]);
    }
    values = next;
    steps.push({
      values,
      edges,
      note: `${offset} 個前の値を、全員が同時に足す`,
    });
  }
  return steps;
}

/** ブレロック：上りで部分和の木を作り、下りで配り直す（足し算の回数が少ない）。 */
function blelloch(input: readonly number[]) {
  const steps: Step[] = [{ values: [...input], edges: [], note: "元の値" }];
  const values = [...input];
  for (let d = 1; d < N; d *= 2) {
    const edges: [number, number][] = [];
    for (let i = 2 * d - 1; i < N; i += 2 * d) {
      values[i] = (values[i] ?? 0) + (values[i - d] ?? 0);
      edges.push([i - d, i]);
    }
    steps.push({
      values: [...values],
      edges,
      note: `上り：${d} 離れた 2 つの部分和をまとめる`,
    });
  }
  values[N - 1] = 0;
  steps.push({ values: [...values], edges: [], note: "いちばん右を 0 にする" });
  for (let d = N / 2; d >= 1; d /= 2) {
    const edges: [number, number][] = [];
    for (let i = 2 * d - 1; i < N; i += 2 * d) {
      const left = values[i - d] ?? 0;
      values[i - d] = values[i] ?? 0;
      values[i] = (values[i] ?? 0) + left;
      edges.push([i, i - d], [i - d, i]);
    }
    steps.push({
      values: [...values],
      edges,
      note: `下り：右の値を左へ渡し、右には左の値を足す（${d} 離れた組）`,
    });
  }
  return steps;
}

type Mode = "hillis" | "blelloch" | "compact";

export const demo: DemoModule = {
  alt: "数の列の先頭からの累積和（プレフィックスサム、スキャン）を、並列に計算するデモ。1 つずつ足していくと 16 個で 15 ステップかかるが、全員が同時に「少し前の値」を足すことを、距離を 1, 2, 4, 8 と倍にしながらくり返すと、4 ステップで終わる（ヒリスとスティールの方法）。足し算の回数も少なくしたいときは、木の形に部分和をまとめてから配り直す方法（ブレロックの方法）を使う。使い道の例として、生きている粒子だけを配列の前に詰める処理（ストリームコンパクション）では、「生きているか（1 か 0）」の累積和が、そのまま詰めた先の番号になる。",
  camera: {
    position: [0, 3.2, 9.5],
    target: [0, 1.2, 0],
    fov: 42,
    orbit: false,
  },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "見るもの",
      value: "hillis",
      options: [
        { value: "hillis", label: "ヒリスとスティールの方法" },
        { value: "blelloch", label: "ブレロックの方法" },
        { value: "compact", label: "使い道：生きている粒子を詰める" },
      ],
    },
    {
      type: "range",
      key: "interval",
      label: "1 ステップの時間（秒）",
      min: 0.4,
      max: 3,
      step: 0.1,
      value: 1.4,
    },
    { type: "button", key: "shuffle", label: "値を入れ替える" },
  ],
  legend: [
    { color: palette.sky, label: "値（棒の高さ）" },
    { color: palette.amber, label: "このステップの足し算（矢印の先に足す）" },
    { color: palette.lime, label: "生きている粒子" },
  ],
  setup(context) {
    const { scene, params } = context;
    const x = (i: number) => (i - (N - 1) / 2) * GAP;
    const barMaterial = context.track(
      new MeshStandardMaterial({ color: palette.sky, roughness: 0.5 })
    );
    const hotMaterial = context.track(
      new MeshStandardMaterial({
        color: palette.amber,
        roughness: 0.5,
        emissive: new Color(palette.amber),
        emissiveIntensity: 0.3,
      })
    );
    const bars = Array.from({ length: N }, (_, i) => {
      const bar = new Mesh(
        new BoxGeometry(GAP * 0.7, 1, GAP * 0.7),
        barMaterial
      );
      bar.position.x = x(i);
      bar.castShadow = true;
      scene.add(bar);
      const label = context.label("", { tone: "strong" });
      scene.add(label);
      return { bar, label };
    });
    const arcs = segments([], palette.amber, { width: 2.5 });
    scene.add(arcs);
    const balls = Array.from({ length: N }, () => {
      const ball = new Mesh(
        new SphereGeometry(0.2, 20, 14),
        new MeshStandardMaterial({ color: palette.lime, roughness: 0.4 })
      );
      scene.add(ball);
      return ball;
    });

    let random = rng(3);
    let input = Array.from({ length: N }, () => 1 + Math.floor(random() * 5));
    let alive = Array.from({ length: N }, () => random() < 0.5);
    let steps: Step[] = [];
    let mode: Mode | "" = "";
    let index = 0;
    let timer = 0;
    let seed = 3;

    const rebuild = (next: Mode) => {
      mode = next;
      index = 0;
      timer = 0;
      steps =
        next === "blelloch"
          ? blelloch(input)
          : next === "hillis"
            ? hillisSteele(input)
            : [];
    };

    return {
      update({ dt }) {
        const { mode: raw } = params;
        const next: Mode =
          raw === "blelloch" || raw === "compact" ? raw : "hillis";
        if (next !== mode) {
          rebuild(next);
        }
        timer += dt;
        const interval = Number(params["interval"]);
        const compact = mode === "compact";
        for (const ball of balls) {
          ball.visible = compact;
        }
        if (compact) {
          // 生きていれば 1、死んでいれば 0 の列の、手前までの累積和（排他的スキャン）が詰めた先の番号
          const flags = alive.map((a) => (a ? 1 : 0));
          const destination: number[] = [];
          let sum = 0;
          for (const flag of flags) {
            destination.push(sum);
            sum += flag;
          }
          const phase = Math.min(1, Math.max(0, (timer - interval) / interval));
          for (const [i, { bar, label }] of bars.entries()) {
            bar.visible = false;
            label.setText(`${destination[i] ?? 0}`);
            label.position.set(x(i), 2.75, 0);
            const ball = balls[i];
            if (ball) {
              ball.material.color.set(
                alive[i] === true ? palette.lime : "#3a4352"
              );
              const target =
                alive[i] === true
                  ? new Vector3(x(destination[i] ?? 0), 0.4, 0)
                  : new Vector3(x(i), 2.2, 0);
              const eased = phase * phase * (3 - 2 * phase);
              ball.position.lerpVectors(
                new Vector3(x(i), 2.2, 0),
                target,
                alive[i] === true ? eased : 0
              );
            }
          }
          arcs.visible = false;
          if (timer > interval * 3.2) {
            timer = 0;
            alive = Array.from({ length: N }, () => random() < 0.5);
          }
          context.readout("ステップ", "");
          context.readout("足し算の回数（合計）", "");
          context.readout("生きている粒子", `${sum} / ${N}`);
          context.caption(
            "上の段が粒子（緑が生きている）。数字は「自分より左にいる生きている粒子の数」で、生きている / 死んでいるを 1 / 0 とした列の累積和で求まる。この数字がそのまま、下の段に詰めたときの番号になる。GPU で大量の粒子を消したり足したりするとき、隙間なく並べ直すのに使う。"
          );
          return;
        }
        if (timer > interval) {
          timer = 0;
          index = index < steps.length - 1 ? index + 1 : 0;
        }
        const step = steps[index];
        if (!step) {
          return;
        }
        const total = input.reduce((sum, value) => sum + value, 0);
        const unit = 2.6 / Math.max(1, total);
        const target = new Set(step.edges.map(([, to]) => to));
        for (const [i, { bar, label }] of bars.entries()) {
          bar.visible = true;
          const value = step.values[i] ?? 0;
          const height = Math.max(0.02, value * unit);
          bar.scale.y = height;
          bar.position.y = height / 2;
          bar.material = target.has(i) ? hotMaterial : barMaterial;
          label.setText(`${value}`);
          label.position.set(x(i), height + 0.25, 0);
        }
        const points: Vector3[] = [];
        for (const [from, to] of step.edges) {
          const a = new Vector3(
            x(from),
            (step.values[from] ?? 0) * unit + 0.5,
            0.3
          );
          const b = new Vector3(
            x(to),
            (step.values[to] ?? 0) * unit + 0.5,
            0.3
          );
          const top = Math.max(a.y, b.y) + 0.15 + Math.abs(to - from) * 0.03;
          // 山なりの線（始点 → 頂点 → 終点）
          const middle = new Vector3((a.x + b.x) / 2, top, 0.3);
          points.push(a, middle, middle, b);
        }
        arcs.setPoints(points);
        arcs.visible = points.length > 0;
        const additions = steps.reduce(
          (sum, s) =>
            sum +
            s.edges.length /
              (mode === "blelloch" && s.note.startsWith("下り") ? 2 : 1),
          0
        );
        context.readout(
          "ステップ",
          `${index} / ${steps.length - 1}：${step.note}`
        );
        context.readout(
          "足し算の回数（合計）",
          `${additions}（1 つずつなら 15）`
        );
        context.readout("生きている粒子", "");
        context.caption(
          mode === "hillis"
            ? "各ステップで、全員が同時に「少し前の値」を足す。距離を 1, 2, 4, 8 と倍にしていくと、4 ステップ（log₂16）で、どの場所にも先頭からの合計が入る。1 つずつ足すと 15 ステップかかる。代わりに足し算の回数は増える。"
            : "上りでは、隣り合う 2 つの部分和を木の形にまとめていく。いちばん右を 0 にしてから、下りでは、右の値を左へ渡し、右には左の値を足していく。最後に、各場所には「自分より手前の合計」（排他的スキャン）が入る。足し算の回数は、1 つずつ足す場合の約 2 倍にしかならない。"
        );
      },
      action(key) {
        if (key === "shuffle") {
          seed++;
          random = rng(seed);
          input = Array.from({ length: N }, () => 1 + Math.floor(random() * 5));
          alive = Array.from({ length: N }, () => random() < 0.5);
          if (mode !== "") {
            rebuild(mode);
          }
        }
      },
    };
  },
};
