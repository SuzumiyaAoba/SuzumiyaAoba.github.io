"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { CinemaMap } from "./cinema-map";
import { ContinuousFlow } from "./continuous-flow";
import {
  CINEMA_CHAPTERS,
  CINEMA_DURATION,
  cinemaFrame,
} from "./cinema-timeline";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";
import { useGenerationPlayback } from "./generation-playback";

/** 全体の現在地を残し、値が計算されて次へ渡る過程を主図で追う。 */
export function LlmAnatomyLab() {
  const viewport = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [staticElapsed, setStaticElapsed] = useState(CINEMA_DURATION);
  const playback = useGenerationPlayback(
    viewport,
    paused,
    rate,
    CINEMA_DURATION,
    16
  );
  const elapsed = playback.reducedMotion ? staticElapsed : playback.elapsed;
  const frame = cinemaFrame(elapsed);
  const completed = elapsed >= CINEMA_DURATION;
  const trace = useMemo(() => runGeneration(DEFAULT_FLOW_IDS), []);
  const selection = useMemo(() => chooseGeneration(trace, 0.62), [trace]);

  return (
    <main className="llm-cinema bg-background text-foreground" data-llm-lab>
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-3 py-3 sm:px-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-base font-semibold sm:text-xl">
            数値が、次のトークンになるまで
          </h1>
          <span className="hidden text-xs text-muted-foreground md:inline">
            入力「私は猫」
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!playback.reducedMotion && (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                aria-pressed={paused}
                disabled={completed}
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? "再開" : "一時停止"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setPaused(false);
                  playback.replay();
                }}
              >
                もう一度見る
              </Button>
              <label className="flex items-center gap-1 text-xs">
                <span className="sr-only">再生速度</span>
                <select
                  aria-label="再生速度"
                  value={rate}
                  onChange={(event) =>
                    setRate(Number(event.currentTarget.value))
                  }
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                >
                  <option value="0.5">0.5倍</option>
                  <option value="1">1倍 · 約3分</option>
                  <option value="2">2倍</option>
                </select>
              </label>
            </>
          )}
        </div>
      </header>
      <CinemaMap stage={frame.stage} progress={frame.progress} />
      <section
        className="llm-cinema-scene"
        aria-label="データが計算される過程"
        data-cinema-chapter={frame.id}
      >
        <div className="flex items-baseline justify-between gap-3 px-3 pt-3 sm:px-8 sm:pt-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              {String(frame.chapterIndex + 1).padStart(2, "0")} /{" "}
              {CINEMA_CHAPTERS.length}{" "}
              <span className="ml-2 font-sans">
                {playback.reducedMotion
                  ? "静止表示"
                  : completed
                    ? "一巡が完了"
                    : paused
                      ? "停止中"
                      : "自動再生中"}
              </span>
            </p>
            <h2
              className="mt-1 text-lg font-semibold tracking-tight sm:text-2xl"
              data-cinema-title
            >
              {frame.title}
            </h2>
          </div>
          <p className="hidden shrink-0 text-xs text-muted-foreground lg:block">
            同じ回路を保ち、データに沿って連続追従
          </p>
        </div>
        <div
          ref={viewport}
          className="llm-cinema-viewport"
          data-cinema-viewport
        >
          <ContinuousFlow
            trace={trace}
            selection={selection}
            elapsed={elapsed}
          />
        </div>
      </section>
      <footer
        className="space-y-2 border-t px-3 py-3 sm:px-8"
        data-cinema-caption
      >
        <p
          className="min-h-20 text-sm leading-relaxed sm:min-h-10"
          data-cinema-explanation
        >
          {frame.explanation}
        </p>
        <div className="flex items-center gap-3">
          <label
            htmlFor="llm-lab-time"
            className="shrink-0 text-xs text-muted-foreground"
          >
            時間軸
          </label>
          <input
            id="llm-lab-time"
            type="range"
            min="0"
            max={CINEMA_DURATION}
            step="50"
            value={elapsed}
            aria-valuetext={frame.title}
            className="h-4 min-w-0 flex-1 accent-primary"
            onChange={(event) => {
              const time = Number(event.currentTarget.value);
              if (playback.reducedMotion) {
                setStaticElapsed(time);
              } else {
                setPaused(true);
                playback.seek(time);
              }
            }}
          />
          <output
            htmlFor="llm-lab-time"
            className="w-12 text-right font-mono text-xs text-muted-foreground"
          >
            {Math.round((elapsed / CINEMA_DURATION) * 100)}%
          </output>
        </div>
        <p className="text-xs text-muted-foreground">
          未学習の教材モデル（4成分・2ヘッド・1ブロック・8語彙）。全出力は同じ演算の計算結果。表示だけを丸め、動きは説明用。
        </p>
      </footer>
    </main>
  );
}
