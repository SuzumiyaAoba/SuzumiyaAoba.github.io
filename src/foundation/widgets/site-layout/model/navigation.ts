import { toLocalePath } from "@/shared/lib/routing";

export type NavigationItem = {
  href: string;
  ja: string;
  en: string;
  japaneseOnly?: boolean;
};

type NavigationGroup = {
  ja: string;
  en: string;
  items: NavigationItem[];
};

const BLOG: NavigationItem = { href: "/blog", ja: "記事", en: "Articles" };
const SERIES: NavigationItem = { href: "/series", ja: "連載", en: "Series" };
const KEYWORDS: NavigationItem = {
  href: "/keywords",
  ja: "キーワード",
  en: "Keywords",
};
const ARCHIVE: NavigationItem = {
  href: "/archive",
  ja: "資料",
  en: "Resources",
};
const ABOUT: NavigationItem = { href: "/about", ja: "About", en: "About" };

/** ヘッダーに常に並べる主要な行き先。迷わないよう 5 つに絞る。 */
export const primaryItems: NavigationItem[] = [
  BLOG,
  SERIES,
  KEYWORDS,
  ARCHIVE,
  ABOUT,
];

/** フッターとモバイルメニューに出すサイト全体の地図。 */
export const navigationGroups: NavigationGroup[] = [
  {
    ja: "読む",
    en: "Read",
    items: [
      BLOG,
      SERIES,
      { href: "/books", ja: "書籍", en: "Books", japaneseOnly: true },
    ],
  },
  {
    ja: "探す",
    en: "Explore",
    items: [
      { href: "/tags", ja: "タグ", en: "Tags" },
      KEYWORDS,
      { href: "/search", ja: "検索", en: "Search" },
    ],
  },
  {
    ja: "資料",
    en: "Resources",
    items: [
      { href: "/archive/ai-news", ja: "AIニュース", en: "AI News" },
      { href: "/tools", ja: "ツール", en: "Tools" },
      { href: "/awesome-something", ja: "Awesome", en: "Awesome" },
    ],
  },
  {
    ja: "このサイト",
    en: "This site",
    items: [
      ABOUT,
      { href: "/contact", ja: "お問い合わせ", en: "Contact" },
      { href: "/privacy-policy", ja: "プライバシー", en: "Privacy" },
      { href: "/rss.xml", ja: "RSS", en: "RSS" },
    ],
  },
];

/** 主要な行き先の配下として扱うパス。タグは記事の、ツール類は資料の一部とみなす。 */
const SECTION_ALIASES: Record<string, string[]> = {
  "/blog": ["/tags"],
  "/archive": ["/tools", "/awesome-something"],
};

const isWithin = (path: string, href: string) =>
  path === href || path.startsWith(`${href}/`);

export function getNavigationState(path: string) {
  const currentPath = toLocalePath(path, "ja").replace(/\/$/u, "");
  const isReading =
    currentPath.startsWith("/blog/post/") ||
    currentPath.startsWith("/notes/") ||
    currentPath.startsWith("/keywords/") ||
    currentPath.startsWith("/books/");
  const isActive = (href: string) =>
    isWithin(currentPath, href) ||
    (SECTION_ALIASES[href] ?? []).some((alias) => isWithin(currentPath, alias));

  return { isReading, isActive };
}
