import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ButtonHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Pin, X } from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { formatReleaseDate } from "../model/release-calendar";
import type { Release } from "../model/release-calendar";
import { ProviderIcon } from "./provider-identity";
import { ReleaseCard } from "./release-card";

type PopoverTarget = {
  id: string;
  date: string;
  releases: Release[];
  series?: string;
};

type OpenPopover = PopoverTarget & {
  anchor: HTMLButtonElement;
  bounds: DOMRect;
  pinned: boolean;
  focusOnOpen: boolean;
};

export type ReleasePopoverControls = ReturnType<typeof useReleasePopover>;

/** 時間軸とカレンダーで、プレビューと固定した詳細を一つだけ表示する。 */
export function useReleasePopover(locale: Locale) {
  const id = useId();
  const [active, setActive] = useState<OpenPopover | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoringFocus = useRef(false);

  const dismiss = useCallback(
    (restoreFocus = false) => {
      setActive(null);
      if (restoreFocus && active?.anchor.isConnected) {
        restoringFocus.current = true;
        active.anchor.focus({ preventScroll: true });
        restoringFocus.current = false;
      }
    },
    [active]
  );

  function showDetails(
    target: PopoverTarget,
    anchor: HTMLButtonElement,
    focusOnOpen = false
  ) {
    setActive({
      ...target,
      anchor,
      bounds: anchor.getBoundingClientRect(),
      pinned: true,
      focusOnOpen,
    });
  }

  function getTriggerProps(
    target: PopoverTarget
  ): ButtonHTMLAttributes<HTMLButtonElement> {
    const current = active?.id === target.id;
    const pinned = current && active.pinned;
    const preview = (anchor: HTMLButtonElement) => {
      if (restoringFocus.current) {
        return;
      }
      setActive((previous) =>
        previous?.pinned
          ? previous
          : {
              ...target,
              anchor,
              bounds: anchor.getBoundingClientRect(),
              pinned: false,
              focusOnOpen: false,
            }
      );
    };
    const hidePreview = () => {
      setActive((previous) =>
        previous?.id === target.id && !previous.pinned ? null : previous
      );
    };
    return {
      "aria-haspopup": "dialog",
      "aria-expanded": pinned,
      "aria-controls": pinned ? id : undefined,
      "aria-describedby": current && !pinned ? id : undefined,
      onMouseEnter: (event) => preview(event.currentTarget),
      onMouseLeave: hidePreview,
      onFocus: (event) => preview(event.currentTarget),
      onBlur: hidePreview,
      onClick: (event) => {
        if (pinned) {
          dismiss();
        } else {
          showDetails(target, event.currentTarget, event.detail === 0);
        }
      },
      onKeyDown: (event) => {
        if (pinned && event.key === "Tab" && !event.shiftKey) {
          event.preventDefault();
          panelRef.current?.focus({ preventScroll: true });
        }
      },
    };
  }

  useEffect(() => {
    if (!active) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !active.anchor.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        dismiss();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss(active.pinned);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, dismiss]);

  return {
    getTriggerProps,
    showDetails,
    dismiss,
    content: active ? (
      <ReleasePopover
        key={`${active.id}-${active.pinned}`}
        active={active}
        id={id}
        locale={locale}
        panelRef={panelRef}
        onClose={dismiss}
      />
    ) : null,
  };
}

function ReleasePopover({
  active,
  id,
  locale,
  panelRef,
  onClose,
}: {
  active: OpenPopover;
  id: string;
  locale: Locale;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onClose: (restoreFocus?: boolean) => void;
}) {
  const en = locale === "en";
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const dateLabel = formatReleaseDate(active.date, locale);
  const providers = [
    ...new Set(active.releases.map((release) => release.provider)),
  ];
  const interval = active.releases[0]?.intervals.find(
    (item) => !active.series || item.series === active.series
  );

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const update = () => {
      // 選択後は画面上の位置を保ち、カレンダーの仮想スクロールでも詳細を読めるようにする。
      const rect = active.pinned
        ? active.bounds
        : active.anchor.getBoundingClientRect();
      if (!active.pinned) {
        const region = active.anchor.closest<HTMLElement>(
          "[data-release-viewport]"
        );
        const bounds = region?.getBoundingClientRect();
        const style = region ? getComputedStyle(region) : null;
        if (
          !active.anchor.isConnected ||
          (bounds &&
            (rect.right <=
              Math.max(
                0,
                bounds.left +
                  (Number.parseFloat(style?.scrollPaddingLeft ?? "0") || 0)
              ) ||
              rect.left >= Math.min(window.innerWidth, bounds.right) ||
              rect.bottom <=
                Math.max(
                  0,
                  bounds.top +
                    (Number.parseFloat(style?.scrollPaddingTop ?? "0") || 0)
                ) ||
              rect.top >= Math.min(window.innerHeight, bounds.bottom)))
        ) {
          onClose();
          return;
        }
      }
      const top =
        rect.top > window.innerHeight / 2
          ? rect.top - panel.offsetHeight - 8
          : rect.bottom + 8;
      setPosition({
        left: Math.max(
          12,
          Math.min(
            rect.left + rect.width / 2 - panel.offsetWidth / 2,
            window.innerWidth - panel.offsetWidth - 12
          )
        ),
        top: Math.max(
          12,
          Math.min(top, window.innerHeight - panel.offsetHeight - 12)
        ),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    if (!active.pinned) {
      window.addEventListener("scroll", update, true);
    }
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [active, panelRef, onClose]);

  useLayoutEffect(() => {
    if (active.pinned && active.focusOnOpen) {
      panelRef.current?.focus({ preventScroll: true });
    }
  }, [active.pinned, active.focusOnOpen, panelRef]);

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role={active.pinned ? "dialog" : "tooltip"}
      aria-labelledby={active.pinned ? `${id}-title` : undefined}
      tabIndex={active.pinned ? -1 : undefined}
      data-pagefind-ignore
      className={cn(
        "font-noto fixed z-[60] flex max-h-[min(40rem,calc(100dvh-24px))] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl border bg-popover [overflow-wrap:anywhere] text-popover-foreground shadow-xl focus-visible:outline-2 focus-visible:outline-ring",
        active.pinned ? "w-[26rem]" : "pointer-events-none w-72 p-4 text-xs"
      )}
      style={position}
    >
      {active.pinned ? (
        <>
          <div className="flex shrink-0 items-start justify-between gap-3 border-b p-4">
            <div className="min-w-0 space-y-1">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Pin className="size-3" aria-hidden="true" />
                {en ? "Release details" : "リリースの詳細"}
              </p>
              <h2 id={`${id}-title`} className="text-sm font-semibold">
                {dateLabel}
                {active.series && ` · ${active.series}`}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {active.releases.length}
                {en ? " releases" : " 件のリリース"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onClose(true)}
              aria-label={
                en ? "Close release details" : "リリースの詳細を閉じる"
              }
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-3">
            {active.releases.length > 0 ? (
              active.releases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  locale={locale}
                />
              ))
            ) : (
              <p className="p-3 text-sm text-muted-foreground">
                {en
                  ? "No releases recorded on this date."
                  : "この日のリリース記録はありません。"}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {providers.map((provider) => (
              <ProviderIcon
                key={provider}
                provider={provider}
                className="size-7 rounded-lg"
              />
            ))}
            <p className="text-muted-foreground">
              {dateLabel}
              {active.series && ` · ${active.series}`}
            </p>
          </div>
          <p className="leading-5 font-semibold">
            {active.releases.map((release) => release.title).join(" / ") ||
              (en ? "No releases recorded" : "リリース記録なし")}
          </p>
          {interval && (
            <div className="space-y-1 border-t pt-2">
              <p className="font-medium">
                {en
                  ? `After ${interval.days} days`
                  : `前回から ${interval.days} 日`}
              </p>
              <p className="leading-5 text-muted-foreground">
                {interval.previousDate} · {interval.previousTitles.join(" / ")}
              </p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            {en ? "Click to pin release details" : "クリックで詳細を固定表示"}
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}
