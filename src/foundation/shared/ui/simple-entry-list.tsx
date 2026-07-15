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
    <ul className="max-w-3xl divide-y divide-border/40">
      {items.map((item) => (
        <li key={item.slug} className="py-4">
          <a
            href={item.href}
            className="inline-flex flex-col gap-1 transition-colors hover:text-foreground/80"
          >
            <span className="text-base font-medium break-words">{item.title}</span>
            {item.date ? <span className="text-xs text-muted-foreground">{item.date}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
