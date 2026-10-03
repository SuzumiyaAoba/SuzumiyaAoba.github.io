export type EntryCardItem = {
  slug: string;
  title: string;
  description?: string;
  /** 解決済みのリンク先(ロケール適用済み) */
  href: string;
  /** カード下部に表示するCTA(固定文言・件数表示など呼び出し側で用意する) */
  cta: React.ReactNode;
  /** CTA の左に添える補足（件数など） */
  meta?: React.ReactNode;
};

export type EntryCardListProps = {
  items: EntryCardItem[];
  emptyState: React.ReactNode;
};

/**
 * 説明付きの項目を 2 列で並べる一覧。archive/index・series/index で共有する。
 * 画像は使わず、タイトル・説明・行き先の 3 点だけで選べるようにする。
 */
export function EntryCardList({ items, emptyState }: EntryCardListProps) {
  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <ul className="collection-card-list">
      {items.map((item) => (
        <li key={item.slug}>
          <article className="collection-card">
            <a href={item.href} className="collection-card-link">
              <h2 className="collection-card-title">{item.title}</h2>
              {item.description ? (
                <p className="collection-card-description">
                  {item.description}
                </p>
              ) : null}
              <p className="collection-card-footer">
                {item.meta === undefined ? null : (
                  <span className="collection-card-meta">{item.meta}</span>
                )}
                <span className="collection-card-cta">{item.cta}</span>
              </p>
            </a>
          </article>
        </li>
      ))}
    </ul>
  );
}
