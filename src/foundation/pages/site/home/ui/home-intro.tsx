import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site";

type HomeIntroProps = {
  locale: Locale;
  postCount: number;
  keywordCount: number;
  seriesCount: number;
};

type DirectoryEntry = {
  href: string;
  label: string;
  count?: string;
  japaneseOnly?: boolean;
};

export function HomeIntro({
  locale,
  postCount,
  keywordCount,
  seriesCount,
}: HomeIntroProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);
  const directory: DirectoryEntry[] = [
    {
      href: "/blog",
      label: t("記事", "Articles"),
      count: String(postCount),
    },
    {
      href: "/series",
      label: t("連載", "Series"),
      count: String(seriesCount),
    },
    {
      href: "/keywords",
      label: t("キーワード", "Keywords"),
      count: String(keywordCount),
    },
    {
      href: "/books",
      label: t("書籍", "Books"),
      japaneseOnly: true,
    },
    {
      href: "/archive",
      label: t("資料", "Resources"),
    },
  ];

  return (
    <section className="home-intro site-container" aria-labelledby="home-title">
      <div className="home-intro-copy">
        <p className="home-author">SuzumiyaAoba</p>
        <h1 id="home-title" className="home-title" lang="la">
          {SITE_TITLE}
        </h1>
        <p className="home-gloss">
          {t("偽からは、何でも導かれる。", "From falsehood, anything follows.")}
        </p>
        <a href={toLocalePath("/about", locale)} className="arrow-link">
          {t("このサイトについて", "About this site")}
          <span aria-hidden="true">→</span>
        </a>
      </div>
      <nav
        className="home-directory"
        aria-label={t("このサイトの内容", "What's on this site")}
      >
        <ul>
          {directory.map((entry) => (
            <li key={entry.href}>
              <a
                href={toLocalePath(
                  entry.href,
                  entry.japaneseOnly ? "ja" : locale
                )}
                hrefLang={entry.japaneseOnly && en ? "ja" : undefined}
              >
                <span className="home-directory-label">{entry.label}</span>
                <span className="home-directory-count">
                  {entry.count ?? <span aria-hidden="true">→</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
