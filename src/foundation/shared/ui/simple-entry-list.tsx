export type SimpleEntryListItem = {
  slug: string;
  title: string;
  date?: string;
  /** 解決済みのリンク先(ロケール適用済み) */
  href: string;
};

export type SimpleEntryListProps = {
  items: SimpleEntryListItem[];
  emptyState: React.ReactNode;
};

/**
 * サムネイル無しのシンプルなリスト。books/index・notes/index で共有する。
 */
export function SimpleEntryList({ items, emptyState }: SimpleEntryListProps) {
  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <ul className="simple-journal-list">
      {items.map((item, index) => (
        <li key={item.slug}>
          <a
            href={item.href}
            className="simple-entry-link flex min-h-18 items-center gap-4 px-1 py-4 sm:gap-6"
          >
            <span className="simple-entry-number font-mono" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="simple-entry-title block text-base font-medium leading-normal break-words">
                {item.title}
              </span>
              {item.date ? (
                <span className="block text-xs tabular-nums text-muted-foreground">
                  {item.date}
                </span>
              ) : null}
            </span>
            <span aria-hidden="true" className="simple-entry-arrow shrink-0">
              →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
