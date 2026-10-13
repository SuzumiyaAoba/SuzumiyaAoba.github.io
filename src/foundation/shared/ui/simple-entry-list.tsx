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
          <a href={item.href} className="simple-entry-link">
            <span className="simple-entry-number" aria-hidden="true">
              {index + 1}
            </span>
            <span className="simple-entry-title">{item.title}</span>
            {item.date ? (
              <span className="simple-entry-date">{item.date}</span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
