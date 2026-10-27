"use client";

/* eslint-disable jsx-a11y/prefer-tag-over-role -- WebGL のキャンバスに画像の代替説明を付ける。 */

import { useId } from "react";
import { Button } from "@/shared/ui/button";
import type { Locale } from "@/shared/lib/routing";
import { headphoneNames } from "@/shared/ui/audio/definitions/viewer";
import type { AudioModel } from "@/shared/ui/audio/definitions/viewer";
import { useAudioViewer } from "./use-audio-viewer";
import { HeadphoneControls, ViewerControls } from "./viewer-controls";
import {
  getHeadphoneConnectionLabel,
  getHeadphonePlacementLabel,
} from "./viewer-labels";

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
  const {
    container,
    canvas,
    status,
    selected,
    interactive,
    attempt,
    headphones,
    selectView,
    toggleInteraction,
    selectHeadphones,
    zoom,
    retry,
  } = useAudioViewer(model);
  const ready = status === "ready";
  const headphoneConnection = getHeadphoneConnectionLabel(headphones, locale);
  const headphonePlacement = getHeadphonePlacementLabel(headphones, locale);

  return (
    <figure className="space-y-4" aria-labelledby={`${id}-caption`}>
      {model === "system" && (
        <HeadphoneControls
          id={`${id}-headphones`}
          locale={locale}
          selected={headphones}
          ready={ready}
          onSelect={selectHeadphones}
        />
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
                ? `NODE、UD-505、CG-10M、HA-1A MK2、${headphoneNames[headphones]}とヘッドホンスタンドの3Dモデル。${headphonePlacement}接続先：${headphoneConnection}。矢印キーで回転、プラス・マイナスで拡大縮小、Homeで全体表示。`
                : `3D system with NODE, UD-505, CG-10M, HA-1A MK2, ${headphoneNames[headphones]} and a headphone stand. ${headphonePlacement} Connected to ${headphoneConnection}. Arrow keys rotate, plus and minus zoom, and Home resets the view.`
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
              <Button variant="outline" size="sm" onClick={retry}>
                {ja ? "再読み込み" : "Try again"}
              </Button>
            )}
          </div>
        )}
      </div>
      <ViewerControls
        locale={locale}
        model={model}
        selected={selected}
        interactive={interactive}
        ready={ready}
        onSelectView={selectView}
        onToggleInteraction={toggleInteraction}
        onZoom={zoom}
      />
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
