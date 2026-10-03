import { cn } from "@/shared/lib/utils";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * 構造化データと共有している英語のセクション名を、画面表示用の言葉に置き換える。
 */
const SECTION_LABELS: Record<string, { ja: string; en: string }> = {
  Home: { ja: "ホーム", en: "Home" },
  Blog: { ja: "記事", en: "Articles" },
  Tags: { ja: "タグ", en: "Tags" },
  Series: { ja: "連載", en: "Series" },
  Notes: { ja: "ノート", en: "Notes" },
  Books: { ja: "書籍", en: "Books" },
  Archive: { ja: "資料", en: "Resources" },
  Tools: { ja: "ツール", en: "Tools" },
  Keywords: { ja: "キーワード", en: "Keywords" },
};

/** 英語版のパスは必ず /en で始まる（toLocalePath の規約）。 */
const isEnglishPath = (path: string) =>
  path === "/en" || path.startsWith("/en/");

/**
 * パンくずリスト。ヘッダーのナビゲーションで現在地が分かる 2 階層以下のページでは表示しない。
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length <= 2) {
    return null;
  }
  const lang = isEnglishPath(items[0]?.path ?? "") ? "en" : "ja";
  const labelOf = (name: string) => SECTION_LABELS[name]?.[lang] ?? name;

  return (
    <nav className={cn("breadcrumbs", className)} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.path}-${item.name}`}>
              {isLast ? (
                <span aria-current="page">{labelOf(item.name)}</span>
              ) : (
                <a href={item.path}>{labelOf(item.name)}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
