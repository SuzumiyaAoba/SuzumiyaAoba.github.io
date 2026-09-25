"use client";

/* eslint-disable jsx-a11y/prefer-tag-over-role -- Canvas drawings need an image role and their textual alternative; an img cannot render the interactive scene. */

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/shared/ui/button";
import type { Locale } from "@/shared/lib/routing";
import type { KeywordAnimation } from "../model/catalog";
import { DEMO_DURATION } from "../model/demo-presets";
import type { DemoPreset } from "../model/demo-presets";
import { HEIGHT, WIDTH } from "./demo/drawing";
import type { Palette } from "./demo/drawing";

const motionPreference = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const query = window.matchMedia(motionPreference);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getMotionPreference = () => window.matchMedia(motionPreference).matches;
const getServerMotionPreference = () => true;

function readPalette(element: HTMLCanvasElement): Palette {
  const styles = getComputedStyle(element);
  const read = (name: string) =>
    styles.getPropertyValue(`--demo-${name}`).trim();
  return {
    background: read("background"),
    surface: read("surface"),
    grid: read("grid"),
    muted: read("muted"),
    ink: read("ink"),
    accent: read("accent"),
    secondary: read("secondary"),
    warm: read("warm"),
  };
}

type Props = {
  slug: string;
  name: string;
  animation: KeywordAnimation;
  preset: DemoPreset;
  illustrative: boolean;
  locale: Locale;
};

export function KeywordDemo({
  slug,
  name,
  animation,
  preset,
  illustrative,
  locale,
}: Props) {
  const ja = locale === "ja";
  const id = useId();
  const referenceCanvas = useRef<HTMLCanvasElement>(null);
  const effectCanvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const elapsed = useRef(1.2);
  const drawCurrent = useRef<((time: number) => void) | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionPreference,
    getServerMotionPreference
  );
  const [playing, setPlaying] = useState<boolean | null>(null);
  const [speed, setSpeed] = useState(1);
  const [amount, setAmount] = useState(1);
  const [progress, setProgress] = useState(1.2);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );
  const isPlaying = playing ?? !reducedMotion;

  useEffect(() => {
    const left = referenceCanvas.current;
    const right = effectCanvas.current;
    const container = stage.current;
    if (!(left && right && container)) {
      return;
    }
    const leftContext = left.getContext("2d");
    const rightContext = right.getContext("2d");
    if (!(leftContext && rightContext)) {
      setStatus("unavailable");
      return;
    }
    let disposed = false;
    let frame = 0;
    let previous = 0;
    let lastPaint = 0;
    let lastProgress = 0;
    let inView = true;
    const palette = readPalette(left);
    const resize = () => {
      for (const canvas of [left, right]) {
        const scale = Math.min(2, window.devicePixelRatio || 1);
        const width = Math.max(
          1,
          Math.round(canvas.getBoundingClientRect().width * scale)
        );
        canvas.width = width;
        canvas.height = Math.round((width * HEIGHT) / WIDTH);
        canvas
          .getContext("2d")
          ?.setTransform(width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
      }
      drawCurrent.current?.(elapsed.current);
    };
    const canRun = () => isPlaying && inView && !document.hidden;
    const tick = (timestamp: number) => {
      if (disposed || !canRun()) {
        return;
      }
      if (previous > 0) {
        elapsed.current =
          (elapsed.current +
            Math.min((timestamp - previous) / 1000, 0.1) * speed) %
          DEMO_DURATION;
      }
      previous = timestamp;
      if (timestamp - lastPaint >= 1000 / 30) {
        drawCurrent.current?.(elapsed.current);
        lastPaint = timestamp;
      }
      if (timestamp - lastProgress >= 100) {
        setProgress(elapsed.current);
        lastProgress = timestamp;
      }
      frame = requestAnimationFrame(tick);
    };
    const updatePlayback = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (canRun()) {
        frame = requestAnimationFrame(tick);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      updatePlayback();
    });
    const resizeObserver = new ResizeObserver(resize);
    const initialize = async () => {
      try {
        const { renderDemo } = await import("./demo/renderer");
        if (disposed) {
          return;
        }
        drawCurrent.current = (time: number) => {
          renderDemo(preset.family, {
            ctx: leftContext,
            palette,
            time,
            amount: 0,
            slug,
          });
          renderDemo(preset.family, {
            ctx: rightContext,
            palette,
            time,
            amount,
            slug,
          });
        };
        resize();
        setStatus("ready");
        observer.observe(container);
        resizeObserver.observe(container);
        document.addEventListener("visibilitychange", updatePlayback);
        updatePlayback();
      } catch {
        if (!disposed) {
          setStatus("unavailable");
        }
      }
    };
    void initialize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
      drawCurrent.current = null;
    };
  }, [amount, isPlaying, preset.family, slug, speed]);

  const seek = (value: number) => {
    setPlaying(false);
    elapsed.current = value;
    setProgress(value);
    drawCurrent.current?.(value);
  };
  const stageLabel = ja ? "比較用アニメーション" : "Animation comparison";

  return (
    <figure
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-labelledby={`${id}-title`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="section-label">
            {illustrative ? "Interactive model" : "Interactive demo"}
          </p>
          <h3 id={`${id}-title`} className="mt-1 font-semibold" lang="ja">
            {animation.subject}
          </h3>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {ja ? "同じ時刻で比較" : "Synchronized comparison"}
        </span>
      </div>
      <div ref={stage} className="grid gap-px bg-border md:grid-cols-2">
        <div className="min-w-0 bg-card">
          <div className="flex items-center gap-2 px-4 py-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">A</span>
            <span>{ja ? "比較対象" : "Reference"}</span>
          </div>
          <canvas
            ref={referenceCanvas}
            width={WIDTH}
            height={HEIGHT}
            className="keyword-demo-stage"
            role="img"
            aria-label={`${stageLabel}: ${preset.reference}`}
          >
            {preset.reference}
          </canvas>
          <p className="px-4 py-3 text-sm text-muted-foreground" lang="ja">
            {preset.reference}
          </p>
        </div>
        <div className="min-w-0 bg-card">
          <div className="flex items-center gap-2 px-4 py-3 text-sm">
            <span className="font-mono text-xs text-brand">B</span>
            <span className="font-semibold">{name}</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {Math.round(amount * 100)}%
            </span>
          </div>
          <canvas
            ref={effectCanvas}
            width={WIDTH}
            height={HEIGHT}
            className="keyword-demo-stage"
            role="img"
            aria-label={`${stageLabel}: ${animation.impact}`}
          >
            {animation.impact}
          </canvas>
          <p className="px-4 py-3 text-sm" lang="ja">
            {animation.impact}
          </p>
        </div>
      </div>
      {status !== "ready" && (
        <output className="block px-5 py-3 text-sm text-muted-foreground">
          {status === "loading"
            ? ja
              ? "デモを読み込み中…"
              : "Loading demo…"
            : ja
              ? "デモを表示できませんでした。下のコマ送り解説で変化を確認できます。"
              : "The demo could not be displayed. The storyboard below explains the effect."}
        </output>
      )}
      <div className="space-y-4 border-t border-border p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            disabled={status !== "ready"}
            onClick={() => setPlaying(!isPlaying)}
          >
            {isPlaying ? (ja ? "一時停止" : "Pause") : ja ? "再生" : "Play"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={status !== "ready"}
            onClick={() => seek(0)}
          >
            {ja ? "最初に戻す" : "Rewind"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={status !== "ready"}
            onClick={() =>
              seek(Math.min(DEMO_DURATION, elapsed.current + 1 / 30))
            }
          >
            {ja ? "1コマ進む" : "Step"}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <label
              htmlFor={`${id}-speed`}
              className="text-xs text-muted-foreground"
            >
              {ja ? "再生速度" : "Speed"}
            </label>
            <select
              id={`${id}-speed`}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value={0.25}>0.25×</option>
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label
            className="space-y-1.5 text-xs"
            aria-label={ja ? "時間" : "Time"}
            htmlFor={`${id}-time`}
          >
            <span className="flex justify-between gap-3">
              <span>{ja ? "時間" : "Time"}</span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {progress.toFixed(2)} / {DEMO_DURATION.toFixed(2)} s
              </span>
            </span>
            <input
              id={`${id}-time`}
              type="range"
              min={0}
              max={DEMO_DURATION}
              step={0.01}
              value={progress}
              aria-valuetext={`${progress.toFixed(2)} s`}
              onChange={(event) => seek(Number(event.target.value))}
              className="keyword-demo-range"
              disabled={status !== "ready"}
            />
          </label>
          <label
            className="space-y-1.5 text-xs"
            aria-label={ja ? "B の変化量" : "B · effect amount"}
            htmlFor={`${id}-amount`}
          >
            <span className="flex justify-between gap-3">
              <span>{ja ? "B の変化量" : "B · effect amount"}</span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {Math.round(amount * 100)}%
              </span>
            </span>
            <input
              id={`${id}-amount`}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={amount}
              aria-valuetext={`${Math.round(amount * 100)}%`}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="keyword-demo-range"
              disabled={status !== "ready"}
            />
          </label>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {ja
            ? "時間を動かすと停止して観察できます。変化量 0% で A と同じ状態、100% で B の効果を表示します。8 秒で繰り返します。"
            : "Scrub to pause and inspect. At 0%, B matches A; at 100%, B shows the effect. The scene repeats every 8 seconds."}
        </p>
      </div>
      <figcaption className="space-y-3 border-t border-border bg-muted/30 p-5">
        <p className="text-sm leading-relaxed" lang="ja">
          <span className="font-semibold">
            {ja ? "見るポイント：" : "Look for: "}
          </span>
          {animation.middle} → {animation.end}。
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {illustrative
            ? ja
              ? "用途と変化を理解するための簡略化した動作モデルです。元のアルゴリズムや描画方式を完全に実装したものではなく、表示する処理数は実測性能ではありません。"
              : "This model simplifies the technique to show its use case and effect. Operation counts describe the model; they are not performance measurements."
            : ja
              ? "ゲームでの使いどころを示す小さな描画サンプルです。実際のゲームでは、素材や他の技法と組み合わせて使います。"
              : "A small visual example of a game use case. Games combine these techniques with assets and other effects."}
        </p>
        <noscript>
          {ja
            ? "操作には JavaScript が必要です。下のコマ送り解説もご覧ください。"
            : "JavaScript is required for the interactive demo. A storyboard is available below."}
        </noscript>
      </figcaption>
    </figure>
  );
}
