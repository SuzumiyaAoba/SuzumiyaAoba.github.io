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

export const navigationGroups: NavigationGroup[] = [
  {
    ja: "読む",
    en: "Read",
    items: [
      { href: "/blog", ja: "記事", en: "Blog" },
      { href: "/notes", ja: "ノート", en: "Notes" },
      { href: "/series", ja: "連載", en: "Series" },
      { href: "/books", ja: "書籍", en: "Books", japaneseOnly: true },
    ],
  },
  {
    ja: "探す",
    en: "Explore",
    items: [
      { href: "/tags", ja: "タグから探す", en: "Browse tags" },
      { href: "/archive", ja: "資料とツール", en: "Archive & tools" },
      { href: "/awesome-something", ja: "Awesome", en: "Awesome" },
    ],
  },
  {
    ja: "このサイト",
    en: "This site",
    items: [
      { href: "/about", ja: "About", en: "About" },
      { href: "/contact", ja: "お問い合わせ", en: "Contact" },
      { href: "/rss.xml", ja: "RSS", en: "RSS" },
    ],
  },
];
export const primaryItems = navigationGroups
  .flatMap((group) => group.items)
  .filter((item) => ["/blog", "/notes", "/archive", "/about"].includes(item.href));

export function getNavigationState(path: string) {
  const currentPath = toLocalePath(path, "ja").replace(/\/$/u, "");
  const isReading =
    currentPath.startsWith("/blog/post/") ||
    currentPath.startsWith("/notes/") ||
    currentPath.startsWith("/books/");
  const isActive = (href: string) =>
    currentPath === href ||
    currentPath.startsWith(`${href}/`) ||
    (href === "/archive" && (currentPath === "/tools" || currentPath.startsWith("/tools/")));

  return { isReading, isActive };
}
