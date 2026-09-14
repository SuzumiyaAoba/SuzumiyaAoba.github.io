import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { formatReleaseDate } from "../model/release-calendar";
import type { Provider, Release, ReleaseInterval } from "../model/release-calendar";
import { ProviderIcon, providerStyles } from "./provider-identity";
import type { ReleasePopoverControls } from "./release-popover";

type ReleasePointProps = {
  date: string;
  series: string;
  titles: string;
  interval: ReleaseInterval | undefined;
  provider: Provider;
  locale: Locale;
  position: number;
  lane: number;
  selected: boolean;
  onSelect: () => void;
  labelled: boolean;
  releases: Release[];
  popover: ReleasePopoverControls;
};

/** 近接した日付でも各点を選べるよう段を分け、詳細はスクロール領域の外に表示する。 */
export function ReleasePoint({
  date,
  series,
  titles,
  interval,
  provider,
  locale,
  position,
  lane,
  selected,
  onSelect,
  labelled,
  releases,
  popover,
}: ReleasePointProps) {
  const en = locale === "en";
  const label = `${series} · ${formatReleaseDate(date, locale)} · ${titles}${interval ? ` · ${en ? "after" : "前回から"} ${interval.days}${en ? " days" : "日"}` : ""}`;
  const triggerProps = popover.getTriggerProps({
    id: JSON.stringify([provider, releases[0]?.kind, series, date]),
    date,
    series,
    releases,
  });

  return (
    <>
      {lane > 0 && (
        <span
          aria-hidden="true"
          className={cn("absolute top-10 w-px opacity-40", providerStyles[provider].dot)}
          style={{ left: `${position}%`, height: lane * 40 }}
        />
      )}
      <button
        {...triggerProps}
        type="button"
        aria-label={label}
        aria-pressed={selected}
        onClick={(event) => {
          onSelect();
          triggerProps.onClick?.(event);
        }}
        onFocus={(event) => {
          event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
          triggerProps.onFocus?.(event);
        }}
        className={cn(
          "group absolute z-10 flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-transparent bg-background/95 pr-1 transition-shadow hover:z-20 hover:border-border hover:shadow-sm focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-ring",
          labelled ? "w-36 -translate-x-4" : "w-8 -translate-x-1/2 justify-center",
          selected && "border-teal-600/40 shadow-sm",
        )}
        style={{ left: `${position}%`, top: 24 + lane * 40 }}
      >
        <ProviderIcon
          provider={provider}
          className={cn("size-7 rounded-lg", selected && "ring-2 ring-teal-600 dark:ring-teal-300")}
        />
        {labelled && (
          <span
            aria-hidden="true"
            className="min-w-0 truncate text-[11px] font-medium text-foreground"
          >
            {titles}
          </span>
        )}
      </button>
    </>
  );
}
