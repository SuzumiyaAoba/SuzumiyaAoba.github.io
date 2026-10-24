import type { GenerationStage } from "./generation-stages";

export const STORY_PHASES = [
  {
    stage: "input",
    end: 3200,
    title: "文章を、トークンIDの列に変える",
    explanation:
      "「私」「は」「猫」を、この教材の語彙にあるID 0・1・2へ対応づける。",
    group: 0,
  },
  {
    stage: "embedding",
    end: 6800,
    title: "IDを数値に置き換え、位置の情報を足す",
    explanation:
      "各位置の4成分を行に並べ、Attentionへ渡す。同じ値を残差接続の別経路にも送り、後の加算に使う。",
    group: 0,
  },
  {
    stage: "attention",
    end: 11_600,
    title: "参照先から、重みに応じて情報を集める",
    explanation:
      "埋め込みの出力をLayerNormへ渡し、Q・K・Vを作る。QとKから求めた重みでVを集約し、2ヘッドの結果を4成分へ変換する。",
    group: 1,
  },
  {
    stage: "attention-add",
    end: 14_000,
    title: "集めた情報を、元の表現に加える",
    explanation:
      "Attentionの出力と、分岐する前の表現を成分ごとに足す。これが1本目の残差接続である。",
    group: 1,
  },
  {
    stage: "mlp",
    end: 19_000,
    title: "同じ位置の中で、成分を組み替える",
    explanation:
      "残差①の出力をLayerNormへ渡し、4成分を16成分へ広げ、GELUを通して4成分に戻す。各位置で独立に計算する。",
    group: 1,
  },
  {
    stage: "mlp-add",
    end: 21_400,
    title: "変換した値を、もう一度元の表現に加える",
    explanation:
      "MLPの出力を、その分岐の前の表現に足す。2本目の残差接続で、ブロックの出力が得られる。",
    group: 1,
  },
  {
    stage: "output",
    end: 24_800,
    title: "末尾の表現を、語彙ごとのスコアへ写す",
    explanation:
      "残差②の出力に最終LayerNormを適用し、末尾位置の4成分を語彙のスコアへ変換する。8個の値が、それぞれのトークンIDに対応する。",
    group: 2,
  },
  {
    stage: "probabilities",
    end: 27_800,
    title: "スコアを、合計100%の確率に変える",
    explanation:
      "直前に得た8個のスコアをsoftmaxで確率へ変換する。各IDに確率が対応し、この分布を次のID選択へ渡す。",
    group: 3,
  },
  {
    stage: "selection",
    end: 31_000,
    title: "確率の区間から、一つのIDを選ぶ",
    explanation:
      "確率の大きさで0〜1を区切り、抽選値0.62が入る区間のIDを選ぶ。確率が最大のIDを必ず選ぶ方式ではない。",
    group: 3,
  },
  {
    stage: "decode",
    end: 33_800,
    title: "選ばれたIDから、トークンを復元する",
    explanation:
      "確定したIDで語彙表を引き、表示する文字片を復元する。次の入力に使うのも、ここで選んだ同じIDである。",
    group: 4,
  },
  {
    stage: "return",
    end: 36_000,
    title: "選んだIDを追加し、次の予測へ",
    explanation:
      "IDを末尾に加え、次の予測の入力を用意して一巡を終える。残っている中間値は追加前の計算結果で、次の予測はまだ計算していない。",
    group: 4,
  },
] as const;

export type StoryStage = GenerationStage | "return";

export function storyFrame(elapsed: number) {
  const index = STORY_PHASES.findIndex((phase) => elapsed < phase.end);
  const phaseIndex = index === -1 ? STORY_PHASES.length - 1 : index;
  const phase = STORY_PHASES[phaseIndex] ?? STORY_PHASES[0];
  const start = phaseIndex === 0 ? 0 : (STORY_PHASES[phaseIndex - 1]?.end ?? 0);
  return {
    ...phase,
    phaseIndex,
    progress: Math.max(0, Math.min(1, (elapsed - start) / (phase.end - start))),
    inspectorStep: Math.min(phaseIndex, 9),
  };
}
