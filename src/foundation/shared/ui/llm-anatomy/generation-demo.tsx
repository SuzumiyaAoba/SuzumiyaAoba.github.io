"use client";

import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";
import {
  GENERATION_ANIMATION_DURATION,
  useGenerationPlayback,
} from "./generation-playback";
import { GenerationOverview } from "./generation-story";
import { storyFrame } from "./generation-story-timeline";
import { DemoFrame } from "./visual-frame";

const GenerationInspector = lazy(async () => {
  const inspector = await import("./generation-inspector");
  return { default: inspector.GenerationInspector };
});
const STORY_DRAW = 0.62;
const GROUP_LABELS = [
  "入力",
  "文脈の計算",
  "語彙スコア",
  "確率と選択",
  "復元と次の入力",
] as const;

export function LlmGenerationFlow() {
  const viewport = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    step: number;
    ids: readonly number[];
  }>({ step: 0, ids: DEFAULT_FLOW_IDS });
  const { elapsed, reducedMotion, replay } = useGenerationPlayback(
    viewport,
    paused || inspecting
  );
  const trace = useMemo(() => runGeneration(DEFAULT_FLOW_IDS), []);
  const selection = useMemo(() => chooseGeneration(trace, STORY_DRAW), [trace]);
  const frame = storyFrame(elapsed);
  const completed = elapsed >= GENERATION_ANIMATION_DURATION;

  return (
    <DemoFrame
      title="入力から次のトークンまでの全体図"
      label="LLMの計算とIDの復元を追うデータフロー"
      description="全体の流れを約36秒で示すプレビュー。専用ページでは全体図と数値を同じ画面に並べ、入力・重み・計算・出力をゆっくり追える。"
    >
      <Button asChild>
        <a href="/tools/llm-anatomy/">全体図と数値を並べて見る</a>
      </Button>
      <div
        className="space-y-4"
        data-story-completed={completed ? "true" : "false"}
      >
        <ol
          className="m-0 grid list-none grid-cols-5 gap-1 p-0 text-center text-xs"
          aria-label="説明の流れ"
        >
          {GROUP_LABELS.map((label, index) => (
            <li
              key={label}
              aria-current={index === frame.group ? "step" : undefined}
              className={
                index === frame.group
                  ? "border-b-2 border-primary px-1 py-2 font-medium text-foreground"
                  : "border-b border-border px-1 py-2 text-muted-foreground"
              }
            >
              {label}
            </li>
          ))}
        </ol>
        <figure className="space-y-3">
          <figcaption className="min-h-20 space-y-2">
            <p className="text-lg font-semibold" data-story-title>
              {frame.title}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {frame.explanation}
            </p>
          </figcaption>
          <div className="llm-generation-preview overflow-hidden rounded-lg border bg-background">
            <GenerationOverview
              viewportRef={viewport}
              trace={trace}
              selection={selection}
              stage={frame.stage}
              progress={frame.progress}
            />
          </div>
        </figure>
        <progress
          value={elapsed}
          max={GENERATION_ANIMATION_DURATION}
          aria-label="アニメーションの進行"
          className="h-2 w-full llm-story-progress"
        />
        <div className="flex flex-wrap items-center gap-2">
          {!reducedMotion && !completed && (
            <Button
              type="button"
              variant="outline"
              disabled={inspecting}
              aria-pressed={paused || inspecting}
              onClick={() => setPaused(!paused)}
            >
              {paused ? "再開" : "一時停止"}
            </Button>
          )}
          {!reducedMotion && (
            <Button
              type="button"
              variant="outline"
              disabled={inspecting}
              onClick={() => {
                setPaused(false);
                replay();
              }}
            >
              もう一度見る
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {reducedMotion
              ? "動きを減らす設定に合わせて、完了した図を表示している。"
              : completed
                ? "一巡が完了。選んだIDが、次の入力へ戻った。"
                : inspecting
                  ? "詳細を見ている間、アニメーションは停止している。"
                  : "画面外や別のタブでは、進行を止める。"}
          </span>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        図は、4成分・2ヘッド・1ブロック・8語彙の小モデルを実行した結果を使う。立体のセルの色は数値の符号と大きさを表す。数値の表示だけを丸め、計算と抽選には元の精度の値を使う。固定した説明用の重みであり、学習済みGPT-3や自然な文章を再現するものではない。動きの速さは説明用である。
      </p>
      <details
        onToggle={(event) => {
          const { open } = event.currentTarget;
          if (open) {
            setSnapshot(
              frame.stage === "return"
                ? { step: 0, ids: [...trace.ids, selection.id] }
                : { step: frame.inspectorStep, ids: trace.ids }
            );
          }
          setInspecting(open);
        }}
      >
        <summary className="cursor-pointer text-sm font-medium">
          数値と計算を詳しく見る
        </summary>
        {inspecting && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              いま見ていた段階の計算を確認できる。入力や位置、温度を変えて比較する操作も、ここから行える。
            </p>
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">
                  計算の詳細を読み込んでいます。
                </p>
              }
            >
              <GenerationInspector
                initialStep={snapshot.step}
                initialIds={snapshot.ids}
                initialDraw={STORY_DRAW}
              />
            </Suspense>
          </div>
        )}
      </details>
    </DemoFrame>
  );
}
