"use client";

/* eslint-disable jsx-a11y/prefer-tag-over-role -- WebGL の描画面は画像として扱い、代替テキストを与える。img 要素では描画できない。 */

import { Pause, Play, RotateCcw, Scan } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/shared/ui/button";
import type { Locale } from "@/shared/lib/routing";
import { loadDemo } from "./registry";
import type { StageHandle } from "./runtime";
import type { DemoControl, DemoModule, DemoParams } from "./types";

const motionPreference = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const query = window.matchMedia(motionPreference);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getMotionPreference = () => window.matchMedia(motionPreference).matches;
const getServerMotionPreference = () => false;

const initialParams = (controls: readonly DemoControl[] = []) => {
  const params: DemoParams = {};
  for (const control of controls) {
    if (control.type !== "button") {
      params[control.key] = control.value;
    }
  }
  return params;
};

const decimals = (step: number) => {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
};

type Status = "loading" | "ready" | "unavailable";

function ControlField({
  control,
  value,
  id,
  onChange,
  onAction,
}: {
  control: DemoControl;
  value: number | boolean | string | undefined;
  id: string;
  onChange: (key: string, value: number | boolean | string) => void;
  onAction: (key: string) => void;
}) {
  if (control.type === "button") {
    return (
      <div className="flex flex-col justify-end gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction(control.key)}
        >
          {control.label}
        </Button>
        {control.hint && (
          <span className="text-xs text-muted-foreground">{control.hint}</span>
        )}
      </div>
    );
  }
  if (control.type === "toggle") {
    const checked = value === true;
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(control.key, !checked)}
          className="flex min-h-9 items-center justify-between gap-3 rounded-md text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span>{control.label}</span>
          <span className="keyword-stage-switch" data-checked={checked}>
            <span className="keyword-stage-switch-thumb" />
          </span>
        </button>
        {control.hint && (
          <span className="text-xs text-muted-foreground">{control.hint}</span>
        )}
      </div>
    );
  }
  if (control.type === "select") {
    return (
      <fieldset className="flex min-w-0 flex-col gap-1.5">
        <legend className="mb-1.5 text-sm">{control.label}</legend>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {control.options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(control.key, option.value)}
                className="keyword-stage-segment"
                data-selected={selected}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {control.hint && (
          <span className="text-xs text-muted-foreground">{control.hint}</span>
        )}
      </fieldset>
    );
  }
  const numeric = typeof value === "number" ? value : control.value;
  const text = control.format
    ? control.format(numeric)
    : numeric.toFixed(decimals(control.step));
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-sm"
      >
        <span>{control.label}</span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {text}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={numeric}
        aria-valuetext={text}
        onChange={(event) => onChange(control.key, Number(event.target.value))}
        className="keyword-stage-range"
      />
      {control.hint && (
        <span className="text-xs text-muted-foreground">{control.hint}</span>
      )}
    </div>
  );
}

export function KeywordStage({
  demoKey,
  title,
  locale,
}: {
  demoKey: string;
  title: string;
  locale: Locale;
}) {
  const ja = locale === "ja";
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labelLayer = useRef<HTMLDivElement>(null);
  const handle = useRef<StageHandle | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionPreference,
    getServerMotionPreference
  );
  const [demo, setDemo] = useState<DemoModule | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [params, setParams] = useState<DemoParams>({});
  const [readouts, setReadouts] = useState<
    readonly (readonly [string, string])[]
  >([]);
  const [caption, setCaption] = useState("");
  const [playing, setPlaying] = useState<boolean | null>(null);
  const isPlaying = playing ?? !reducedMotion;
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  useEffect(() => {
    const root = container.current;
    const surface = canvas.current;
    const layer = labelLayer.current;
    if (!(root && surface && layer)) {
      return;
    }
    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let visible = false;
    const updateActive = () =>
      handle.current?.setActive(visible && !document.hidden);
    const initialize = async () => {
      try {
        const [module, runtime] = await Promise.all([
          loadDemo(demoKey),
          import("./runtime"),
        ]);
        if (disposed) {
          return;
        }
        if (!module) {
          setStatus("unavailable");
          return;
        }
        const nextParams = initialParams(module.controls);
        const stage = runtime.createStage(
          root,
          surface,
          layer,
          module,
          { ...nextParams },
          {
            onReadout: setReadouts,
            onCaption: setCaption,
            onParam: (key, value) =>
              setParams((current) => ({ ...current, [key]: value })),
          }
        );
        stage.setPlaying(playingRef.current);
        handle.current = stage;
        setDemo(module);
        setParams(nextParams);
        setStatus("ready");
        observer = new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? false;
          updateActive();
        });
        observer.observe(root);
        document.addEventListener("visibilitychange", updateActive);
      } catch (error) {
        console.error(error);
        if (!disposed) {
          setStatus("unavailable");
        }
      }
    };
    void initialize();
    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", updateActive);
      handle.current?.dispose();
      handle.current = null;
    };
  }, [demoKey]);

  useEffect(() => {
    handle.current?.setPlaying(isPlaying);
  }, [isPlaying, status]);

  const change = (key: string, value: number | boolean | string) => {
    setParams((current) => ({ ...current, [key]: value }));
    handle.current?.setParam(key, value);
  };
  const action = (key: string) => handle.current?.action(key);
  const ready = status === "ready";
  const orbit = demo?.camera?.orbit ?? true;

  return (
    <figure className="space-y-4" aria-labelledby={`${id}-title`}>
      <div ref={container} className="keyword-stage">
        <canvas
          ref={canvas}
          className="absolute inset-0 size-full"
          role="img"
          aria-label={`${title}: ${demo?.alt ?? ""}`}
        >
          {demo?.alt}
        </canvas>
        <div
          ref={labelLayer}
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
          {caption ? (
            <p className="max-w-md keyword-stage-hud" aria-live="polite">
              {caption}
            </p>
          ) : (
            <span />
          )}
          {demo?.legend && demo.legend.length > 0 && (
            <ul className="hidden flex-col gap-1 keyword-stage-hud sm:flex">
              {demo.legend.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <svg
                    className="size-2.5 shrink-0"
                    viewBox="0 0 10 10"
                    aria-hidden="true"
                  >
                    <circle cx="5" cy="5" r="5" fill={item.color} />
                  </svg>
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
          {readouts.length > 0 ? (
            <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 keyword-stage-hud font-mono tabular-nums">
              {readouts.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="keyword-stage-muted">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <span />
          )}
          <div className="pointer-events-auto flex gap-1.5">
            <button
              type="button"
              className="keyword-stage-icon-button"
              onClick={() => setPlaying(!isPlaying)}
              disabled={!ready}
              aria-label={
                isPlaying ? (ja ? "一時停止" : "Pause") : ja ? "再生" : "Play"
              }
            >
              {isPlaying ? (
                <Pause className="size-4" aria-hidden="true" />
              ) : (
                <Play className="size-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="keyword-stage-icon-button"
              onClick={() => handle.current?.restart()}
              disabled={!ready}
              aria-label={ja ? "最初からやり直す" : "Restart"}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
            {orbit && (
              <button
                type="button"
                className="keyword-stage-icon-button"
                onClick={() => handle.current?.resetCamera()}
                disabled={!ready}
                aria-label={ja ? "視点を戻す" : "Reset view"}
              >
                <Scan className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        {status !== "ready" && (
          <output className="keyword-stage-overlay">
            {status === "loading"
              ? ja
                ? "デモを準備しています…"
                : "Preparing the demo…"
              : ja
                ? "この環境では WebGL デモを表示できませんでした。"
                : "This environment could not display the WebGL demo."}
          </output>
        )}
      </div>
      <h3 id={`${id}-title`} className="sr-only">
        {title}
      </h3>
      {demo?.controls && demo.controls.length > 0 && (
        <div className="grid gap-x-6 gap-y-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
          {demo.controls.map((control) => (
            <ControlField
              key={control.key}
              control={control}
              value={params[control.key]}
              id={`${id}-${control.key}`}
              onChange={change}
              onAction={action}
            />
          ))}
        </div>
      )}
      <figcaption className="text-xs leading-relaxed text-muted-foreground">
        {[
          demo?.hint,
          orbit
            ? ja
              ? "ドラッグで視点を回転、Ctrl（⌘）+ スクロールでズーム。タッチ操作は 2 本指です。"
              : "Drag to orbit, Ctrl/⌘ + scroll to zoom. Use two fingers on touch screens."
            : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      </figcaption>
    </figure>
  );
}
