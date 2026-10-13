"use client";

/* eslint-disable jsx-a11y/prefer-tag-over-role -- WebGL のキャンバスに画像の代替説明を付ける。 */

import { Hand, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import type { Locale } from "@/shared/lib/routing";
import { headphoneNames, modelViews } from "./viewer-types";
import type {
  AudioModel,
  AudioView,
  HeadphoneModel,
  ViewerHandle,
  ViewerStatus,
} from "./viewer-types";

const labels: Record<AudioView, Record<Locale, string>> = {
  overview: { ja: "全体", en: "Overview" },
  front: { ja: "正面", en: "Front" },
  rear: { ja: "背面", en: "Rear" },
  top: { ja: "上面", en: "Top" },
  bottom: { ja: "底面", en: "Underside" },
  headphones: { ja: "ヘッドホン端子", en: "Headphone outputs" },
  meter: { ja: "メーター", en: "Meter" },
  outputs: { ja: "クロック出力", en: "Clock outputs" },
  controls: { ja: "タッチパネル", en: "Touch controls" },
  connections: { ja: "接続端子", en: "Connections" },
  side: { ja: "側面", en: "Side" },
  earpads: { ja: "イヤーパッド", en: "Ear pads" },
  headband: { ja: "ヘッドバンド", en: "Headband" },
  grille: { ja: "グリル・ドライバー", en: "Grille & driver" },
  tubes: { ja: "真空管窓", en: "Tube window" },
  dials: { ja: "ダイアル", en: "Dials" },
};

export function AudioViewer({
  locale,
  model,
  name,
  manufacturer,
  finish,
  description,
}: {
  locale: Locale;
  model: AudioModel;
  name: string;
  manufacturer: string;
  finish: string;
  description: string;
}) {
  const ja = locale === "ja";
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<ViewerHandle | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [selected, setSelected] = useState<AudioView | undefined>("overview");
  const [interactive, setInteractive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [headphones, setHeadphones] = useState<HeadphoneModel>("hd-800s");
  const selectedHeadphones = useRef<HeadphoneModel>("hd-800s");

  useEffect(() => {
    let cancelled = false;
    let handle: ViewerHandle | undefined;
    const surface = canvas.current;
    const frame = container.current;
    if (!surface || !frame) {
      return;
    }
    const load = async () => {
      try {
        const { createAudioViewer } = await import("./viewer-runtime");
        if (cancelled) {
          return;
        }
        handle = createAudioViewer({
          model,
          canvas: surface,
          container: frame,
          onStatus: setStatus,
          onView: setSelected,
        });
        viewer.current = handle;
        handle.setHeadphones?.(selectedHeadphones.current);
        const enabled = window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        ).matches;
        handle.setInteractive(enabled);
        setInteractive(enabled);
      } catch {
        if (!cancelled) {
          setStatus("unavailable");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      handle?.dispose();
      viewer.current = null;
    };
  }, [attempt, model]);

  const selectView = (view: AudioView) => {
    viewer.current?.setView(view);
    setSelected(view);
  };
  const toggleInteraction = () => {
    const enabled = !interactive;
    viewer.current?.setInteractive(enabled);
    setInteractive(enabled);
  };
  const ready = status === "ready";
  const selectHeadphones = (headphone: HeadphoneModel) => {
    viewer.current?.setHeadphones?.(headphone);
    selectedHeadphones.current = headphone;
    setHeadphones(headphone);
  };

  return (
    <figure className="space-y-4" aria-labelledby={`${id}-caption`}>
      {model === "system" && (
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-sm text-muted-foreground"
            id={`${id}-headphones`}
          >
            {ja ? "接続するヘッドホン" : "Connected headphones"}
          </span>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-labelledby={`${id}-headphones`}
          >
            {(["hd-800s", "clear-mg-pro"] as const).map((headphone) => (
              <Button
                key={headphone}
                variant={headphones === headphone ? "secondary" : "outline"}
                size="sm"
                disabled={!ready}
                aria-pressed={headphones === headphone}
                onClick={() => selectHeadphones(headphone)}
              >
                {headphoneNames[headphone]}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground" role="status">
            {ja
              ? "HA-1A MK2 正面左の PHONES A · 6.35 mm"
              : "HA-1A MK2 front left PHONES A · 6.35 mm"}
            {" / "}
            {headphoneNames[headphones]}
          </p>
        </div>
      )}
      <div
        ref={container}
        className="audio-stage"
        data-status={status}
        data-model={model}
      >
        <canvas
          key={attempt}
          ref={canvas}
          className="audio-canvas"
          role="img"
          tabIndex={ready ? 0 : -1}
          aria-label={
            model === "system"
              ? ja
                ? `NODE、UD-505、CG-10M、HA-1A MK2、${headphoneNames[headphones]}を配線した3Dモデル。ヘッドホンはアンプ正面左のジャックに接続。矢印キーで回転、プラス・マイナスで拡大縮小、Homeで全体表示。`
                : `3D system connecting NODE, UD-505, CG-10M, HA-1A MK2 and ${headphoneNames[headphones]}. Headphones connect to the amplifier’s front left jack. Arrow keys rotate, plus and minus zoom, and Home resets the view.`
              : ja
                ? `${manufacturer} ${name} ${finish}の3Dモデル。矢印キーで回転、プラス・マイナスで拡大縮小、Homeで全体表示。`
                : `3D model of ${manufacturer} ${name} in ${finish}. Arrow keys rotate, plus and minus zoom, and Home resets the view.`
          }
          aria-describedby={`${id}-instructions`}
        >
          {description}
        </canvas>
        <div
          className="pointer-events-none absolute inset-x-5 top-5 flex items-center justify-between gap-4 text-xs text-muted-foreground sm:inset-x-7 sm:top-7"
          aria-hidden="true"
        >
          <span className="font-mono">
            {manufacturer} / {name}
          </span>
          <span>{finish}</span>
        </div>
        {status !== "ready" && (
          <div className="audio-viewer-message">
            <p role="status">
              {status === "loading"
                ? ja
                  ? "3Dモデルを読み込んでいます…"
                  : "Loading the 3D model…"
                : ja
                  ? "この環境では3D表示を利用できません。下の機器紹介とメーカー写真をご覧ください。"
                  : "3D is unavailable in this environment. You can still read the specifications and view the manufacturer’s photos below."}
            </p>
            {status === "unavailable" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("loading");
                  setSelected("overview");
                  setAttempt((value) => value + 1);
                }}
              >
                {ja ? "再読み込み" : "Try again"}
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={ja ? "視点" : "Viewpoints"}
        >
          {modelViews[model].map((view) => (
            <Button
              key={view}
              variant={selected === view ? "secondary" : "ghost"}
              size="sm"
              disabled={!ready}
              aria-pressed={selected === view}
              onClick={() => selectView(view)}
            >
              {labels[view][locale]}
            </Button>
          ))}
        </div>
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label={ja ? "3D操作" : "3D controls"}
        >
          <Button
            variant={interactive ? "secondary" : "outline"}
            size="sm"
            disabled={!ready}
            aria-pressed={interactive}
            onClick={toggleInteraction}
          >
            <Hand aria-hidden="true" />
            {ja ? "ドラッグ操作" : "Drag to rotate"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!ready}
            aria-label={ja ? "縮小" : "Zoom out"}
            onClick={() => viewer.current?.zoom("out")}
          >
            <Minus aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!ready}
            aria-label={ja ? "拡大" : "Zoom in"}
            onClick={() => viewer.current?.zoom("in")}
          >
            <Plus aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!ready}
            aria-label={ja ? "視点を戻す" : "Reset view"}
            onClick={() => selectView("overview")}
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        </div>
      </div>
      <figcaption
        id={`${id}-caption`}
        className={
          model === "system"
            ? "sr-only"
            : "space-y-2 text-xs leading-relaxed text-muted-foreground"
        }
      >
        <p id={`${id}-instructions`}>
          {ja
            ? "ドラッグ操作を有効にすると、ドラッグで回転、スクロールまたは2本指で拡大・縮小できます。キーボードでは、モデルにフォーカスして矢印キーで回転できます。"
            : "Enable drag controls to rotate, then scroll or pinch to zoom. With the model focused, use the arrow keys to rotate."}
        </p>
        <p>
          {ja
            ? "メーカーの写真と公表仕様をもとに外観を再現しています。部品寸法や見えない部分の形状には推定を含みます。"
            : "Exterior reconstructed from the manufacturer’s photos and specifications. Individual component dimensions and unseen surfaces are estimated."}
        </p>
      </figcaption>
    </figure>
  );
}
