import { Hand, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { Locale } from "@/shared/lib/routing";
import {
  headphoneModels,
  headphoneNames,
  modelViews,
} from "@/shared/ui/audio/definitions/viewer";
import type {
  AudioModel,
  AudioView,
  HeadphoneModel,
  ZoomDirection,
} from "@/shared/ui/audio/definitions/viewer";
import { getHeadphoneConnectionLabel, viewLabels } from "./viewer-labels";

export function HeadphoneControls({
  id,
  locale,
  selected,
  ready,
  onSelect,
}: {
  id: string;
  locale: Locale;
  selected: HeadphoneModel;
  ready: boolean;
  onSelect: (headphone: HeadphoneModel) => void;
}) {
  const ja = locale === "ja";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground" id={id}>
        {ja ? "接続するヘッドホン" : "Connected headphones"}
      </span>
      <fieldset className="flex flex-wrap gap-1.5" aria-labelledby={id}>
        {headphoneModels.map((headphone) => (
          <Button
            key={headphone}
            variant={selected === headphone ? "secondary" : "outline"}
            size="sm"
            disabled={!ready}
            aria-pressed={selected === headphone}
            onClick={() => onSelect(headphone)}
          >
            {headphoneNames[headphone]}
          </Button>
        ))}
      </fieldset>
      <output className="text-xs text-muted-foreground">
        {getHeadphoneConnectionLabel(selected, locale)}
        {" / "}
        {headphoneNames[selected]}
      </output>
    </div>
  );
}

export function ViewerControls({
  locale,
  model,
  selected,
  interactive,
  ready,
  onSelectView,
  onToggleInteraction,
  onZoom,
}: {
  locale: Locale;
  model: AudioModel;
  selected: AudioView | undefined;
  interactive: boolean;
  ready: boolean;
  onSelectView: (view: AudioView) => void;
  onToggleInteraction: () => void;
  onZoom: (direction: ZoomDirection) => void;
}) {
  const ja = locale === "ja";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <fieldset
        className="flex flex-wrap gap-1.5"
        aria-label={ja ? "視点" : "Viewpoints"}
      >
        {modelViews[model].map((view) => (
          <Button
            key={view}
            variant={selected === view ? "secondary" : "ghost"}
            size="sm"
            disabled={!ready}
            aria-pressed={selected === view}
            onClick={() => onSelectView(view)}
          >
            {viewLabels[view][locale]}
          </Button>
        ))}
      </fieldset>
      <fieldset
        className="flex flex-wrap items-center gap-1.5"
        aria-label={ja ? "3D操作" : "3D controls"}
      >
        <Button
          variant={interactive ? "secondary" : "outline"}
          size="sm"
          disabled={!ready}
          aria-pressed={interactive}
          onClick={onToggleInteraction}
        >
          <Hand aria-hidden="true" />
          {ja ? "ドラッグ操作" : "Drag to rotate"}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!ready}
          aria-label={ja ? "縮小" : "Zoom out"}
          onClick={() => onZoom("out")}
        >
          <Minus aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!ready}
          aria-label={ja ? "拡大" : "Zoom in"}
          onClick={() => onZoom("in")}
        >
          <Plus aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!ready}
          aria-label={ja ? "視点を戻す" : "Reset view"}
          onClick={() => onSelectView("overview")}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </fieldset>
    </div>
  );
}
