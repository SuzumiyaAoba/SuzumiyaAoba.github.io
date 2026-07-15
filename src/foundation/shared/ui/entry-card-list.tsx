import Image from "next/image";
import { Icon } from "@iconify/react";

import { Card } from "@/shared/ui/card";
import { resolveThumbnail } from "@/shared/lib/thumbnail";

export type EntryCardItem = {
  slug: string;
  title: string;
  description?: string;
  thumbnail?: string;
  thumbnailBasePath: string;
  /** 解決済みのリンク先(ロケール適用済み) */
  href: string;
  /** カード右下に表示するCTA(固定文言・件数表示など呼び出し側で用意する) */
  cta: React.ReactNode;
};

export type EntryCardListProps = {
  items: EntryCardItem[];
  emptyState: React.ReactNode;
};

/**
 * サムネイル付きのカード一覧。archive/index・series/index で共有する。
 */
export function EntryCardList({ items, emptyState }: EntryCardListProps) {
  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const thumbnail = resolveThumbnail(item.slug, item.thumbnail, {
          basePath: item.thumbnailBasePath,
        });
        const isFallback = thumbnail.type === "image" && thumbnail.isFallback;

        return (
          <li key={item.slug}>
            <Card className="group relative border-transparent bg-card/50 shadow-none transition-colors hover:bg-muted/30">
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-[18px] bg-muted/40 opacity-0 transition duration-200 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100"
              />
              <a
                href={item.href}
                className="relative z-10 flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44">
                  {thumbnail.type === "image" ? (
                    <Image
                      src={thumbnail.src}
                      alt={isFallback ? "Site icon" : item.title}
                      fill
                      sizes="(min-width: 768px) 176px, 100vw"
                      className={
                        isFallback
                          ? "object-contain p-6 opacity-70 dark:invert dark:opacity-80"
                          : "object-cover"
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon
                        icon={thumbnail.icon}
                        className="size-10 text-muted-foreground/70 dark:text-muted-foreground/80"
                        aria-hidden
                      />
                      <span className="sr-only">{item.title}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 py-2">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-foreground">{item.title}</div>
                    {item.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground md:mt-auto">
                    {item.cta}
                  </span>
                </div>
              </a>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
