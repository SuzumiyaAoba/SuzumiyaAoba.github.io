import Image from "next/image";
import { Icon } from "@/shared/ui/icon";

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
    <ul className="collection-card-list">
      {items.map((item) => {
        const thumbnail = resolveThumbnail(item.slug, item.thumbnail, {
          basePath: item.thumbnailBasePath,
        });
        const isFallback = thumbnail.type === "image" && thumbnail.isFallback;

        return (
          <li key={item.slug}>
            <article className="collection-card">
              <a href={item.href} className="collection-card-link">
                <div className="collection-thumbnail relative size-14 shrink-0 overflow-hidden rounded-lg sm:size-16">
                  {thumbnail.type === "image" ? (
                    <Image
                      src={thumbnail.src}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 64px, 56px"
                      className={
                        isFallback
                          ? "object-contain p-3 opacity-70 dark:opacity-80 dark:invert"
                          : "object-cover"
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon
                        icon={thumbnail.icon}
                        className="size-7 text-muted-foreground sm:size-8"
                        aria-hidden
                      />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3 self-stretch">
                  <div className="space-y-1.5">
                    <h2 className="collection-card-title text-base leading-normal font-medium">
                      {item.title}
                    </h2>
                    {item.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="collection-card-cta mt-auto text-sm">
                    {item.cta}
                  </span>
                </div>
              </a>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
