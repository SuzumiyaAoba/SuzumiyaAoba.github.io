"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import { GenerationDetails } from "./generation-details";
import { GenerationDiagram } from "./generation-diagram";
import {
  chooseGeneration,
  decodeFlow,
  DEFAULT_FLOW_IDS,
  FLOW_MAX_CONTEXT,
  FLOW_VOCABULARY,
  runGeneration,
} from "./generation-math";
import { GENERATION_STAGES } from "./generation-stages";

type GenerationInspectorProps = {
  initialStep?: number;
  initialIds?: readonly number[];
  initialDraw?: number;
};

export function GenerationInspector({
  initialStep = 0,
  initialIds = DEFAULT_FLOW_IDS,
  initialDraw = 0.62,
}: GenerationInspectorProps) {
  const id = useId();
  const [ids, setIds] = useState<readonly number[]>(initialIds);
  const [position, setPosition] = useState(initialIds.length - 1);
  const [headIndex, setHeadIndex] = useState(0);
  const [step, setStep] = useState(initialStep);
  const [playing, setPlaying] = useState(false);
  const [temperature, setTemperature] = useState(1);
  const [draw, setDraw] = useState(initialDraw);
  const trace = useMemo(
    () => runGeneration(ids, temperature),
    [ids, temperature]
  );
  const selection = chooseGeneration(trace, draw);
  const current = GENERATION_STAGES[step] ?? GENERATION_STAGES[0];

  useEffect(() => {
    if (!playing || step === GENERATION_STAGES.length - 1) {
      return;
    }
    const timer = window.setTimeout(() => {
      const next = step + 1;
      setStep(next);
      if (next === GENERATION_STAGES.length - 1) {
        setPlaying(false);
      }
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  function chooseStep(next: number) {
    setPlaying(false);
    setStep(next);
  }

  function resetInput(lastId: number) {
    setIds([0, 1, lastId]);
    setPosition(2);
    chooseStep(0);
  }

  function appendSelected() {
    if (selection.isEnd || ids.length >= FLOW_MAX_CONTEXT) {
      return;
    }
    setIds([...ids, selection.id]);
    setPosition(ids.length);
    chooseStep(0);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-md border p-4">
        <p className="font-medium">入力を変えて計算を比べる</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => resetInput(2)}>
            「私は猫」から始める
          </Button>
          <Button type="button" variant="outline" onClick={() => resetInput(3)}>
            「私は犬」から始める
          </Button>
        </div>
        <p className="font-mono break-all" data-flow-input>
          入力ID列：[{ids.join(", ")}] → {decodeFlow(ids)}
        </p>
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted-foreground">
            追跡する位置（確率の予測には常に末尾を使う）
          </legend>
          <div className="flex flex-wrap gap-2">
            {ids.map((tokenId, index) => (
              <Button
                key={`position-${index + 1}`}
                type="button"
                variant={position === index ? "default" : "outline"}
                aria-pressed={position === index}
                onClick={() => setPosition(index)}
              >
                {index + 1}：{FLOW_VOCABULARY[tokenId]?.piece} · ID {tokenId}
              </Button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => {
              if (step === GENERATION_STAGES.length - 1) {
                setStep(0);
              }
              setPlaying(!playing);
            }}
            aria-pressed={playing}
          >
            {playing ? "一時停止" : "順に再生する"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => chooseStep(step - 1)}
          >
            前へ
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={step === GENERATION_STAGES.length - 1}
            onClick={() => chooseStep(step + 1)}
          >
            次の計算へ
          </Button>
          <span className="text-xs text-muted-foreground">
            {step + 1} / {GENERATION_STAGES.length}
          </span>
        </div>
        <nav
          aria-label="データフローの計算段階"
          className="flex flex-wrap gap-2"
        >
          {GENERATION_STAGES.map((stage, index) => (
            <Button
              key={stage.id}
              type="button"
              variant={step === index ? "default" : "outline"}
              aria-current={step === index ? "step" : undefined}
              onClick={() => chooseStep(index)}
            >
              {index + 1} {stage.label}
            </Button>
          ))}
        </nav>
      </div>

      <div className="space-y-2" aria-live="polite" aria-atomic="true">
        <p className="text-base font-semibold">
          {step + 1}．{current.label}
        </p>
        <p className="font-mono text-xs leading-relaxed break-words">
          {current.formula}
        </p>
      </div>

      {current.id === "attention" && (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-xs text-muted-foreground">
            参照の重みを表示するヘッド（計算には両方使う）
          </legend>
          {[0, 1].map((index) => (
            <Button
              key={index}
              type="button"
              variant={index === headIndex ? "default" : "outline"}
              aria-pressed={index === headIndex}
              onClick={() => setHeadIndex(index)}
            >
              Head {index + 1}
            </Button>
          ))}
        </fieldset>
      )}
      {["probabilities", "selection", "decode"].includes(current.id) && (
        <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
          <label htmlFor={`${id}-temperature`} className="grid gap-2">
            <span>温度 T：{temperature.toFixed(1)}</span>
            <input
              id={`${id}-temperature`}
              type="range"
              min="0.2"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(event) => {
                setPlaying(false);
                setTemperature(Number(event.currentTarget.value));
              }}
              className="w-full accent-primary"
            />
          </label>
          <label htmlFor={`${id}-draw`} className="grid gap-2">
            <span>抽選値 r：{draw.toFixed(3)}</span>
            <input
              id={`${id}-draw`}
              type="range"
              min="0"
              max="0.999"
              step="0.001"
              value={draw}
              onChange={(event) => {
                setPlaying(false);
                setDraw(Number(event.currentTarget.value));
              }}
              className="w-full accent-primary"
            />
          </label>
          <div className="space-y-2 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPlaying(false);
                setDraw(Math.random());
              }}
            >
              乱数で引き直す
            </Button>
            <p className="text-xs text-muted-foreground">
              手動のスライダーは0.001刻み。引き直すボタンは、丸めない一様乱数を使う。
            </p>
          </div>
        </div>
      )}

      <GenerationDiagram
        trace={trace}
        stage={current.id}
        position={position}
        headIndex={headIndex}
        selection={selection}
        draw={draw}
        playing={playing}
      />
      <p className="text-xs text-muted-foreground sm:hidden">
        図は左右にスクロールできる。計算の詳細はすぐ下に示す。
      </p>
      <GenerationDetails
        trace={trace}
        stage={current.id}
        position={position}
        headIndex={headIndex}
        selection={selection}
        draw={draw}
      />

      {current.id === "decode" && (
        <div className="space-y-3 rounded-md border border-primary bg-primary/5 p-4">
          <p className="font-medium" data-flow-result>
            選択ID {selection.id} → {selection.piece}
            {selection.isEnd
              ? "：ここで生成を止める"
              : ` → ${decodeFlow([...ids, selection.id])}`}
          </p>
          <Button
            type="button"
            disabled={selection.isEnd || ids.length >= FLOW_MAX_CONTEXT}
            onClick={appendSelected}
          >
            選んだIDを追加して次へ
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {selection.isEnd
              ? "終了IDは文字列へ追加しない。新しい入力、または別の抽選値で試せる。"
              : "ID列に選択IDを一つ追加し、長くなった入力で埋め込みから再計算する。この教材ではKVキャッシュを使わない。"}
            {ids.length >= FLOW_MAX_CONTEXT &&
              " 教材の上限8トークンに達したため、次の入力への追加を止めている。"}
          </p>
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        語彙・ID・分割はこの教材だけの定義である。実モデルとの構成の違いは図の後に示す。数値の表示だけを丸め、計算と抽選には丸める前の値を使う。アニメーションの点は受け渡しを示し、実行時間や処理速度は表さない。
      </p>
    </div>
  );
}
