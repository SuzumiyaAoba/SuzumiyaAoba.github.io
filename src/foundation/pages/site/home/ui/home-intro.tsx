import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SiteLockup } from "@/shared/ui/site-lockup";

type HomeIntroProps = {
  locale: Locale;
  postCount: number;
  keywordCount: number;
  seriesCount: number;
  bookCount: number;
};

type DirectoryEntry = {
  href: string;
  label: string;
  count: number;
  japaneseOnly?: boolean;
};

/** 資料の入口に並ぶもの（AIニュース・ベンチマーク・ツール・Awesome Something）の数 */
const RESOURCE_COUNT = 4;

/**
 * ホームの冒頭。サイト名を推論図として大きく組み、右端に和訳を縦に添える。
 * その下に、このサイトに何があるかを目次の形で並べる。
 */
export function HomeIntro({
  locale,
  postCount,
  keywordCount,
  seriesCount,
  bookCount,
}: HomeIntroProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);
  const directory: DirectoryEntry[] = [
    { href: "/blog", label: t("記事", "Articles"), count: postCount },
    { href: "/series", label: t("連載", "Series"), count: seriesCount },
    {
      href: "/keywords",
      label: t("キーワード", "Keywords"),
      count: keywordCount,
    },
    {
      href: "/books",
      label: t("書籍", "Books"),
      count: bookCount,
      japaneseOnly: true,
    },
    { href: "/archive", label: t("資料", "Resources"), count: RESOURCE_COUNT },
  ];

  return (
    <section
      className="home-masthead site-container"
      aria-labelledby="home-title"
    >
      <h1 id="home-title" className="home-masthead-title">
        <SiteLockup size="lg" showRule />
      </h1>
      <p className="home-masthead-gloss">
        {t("偽からは、何でも導かれる。", "From falsehood, anything follows.")}
      </p>
      <p className="home-masthead-byline">
        <span>SuzumiyaAoba</span>
        <a href={toLocalePath("/about", locale)} className="arrow-link">
          {t("このサイトについて", "About this site")}
        </a>
      </p>
      <nav
        className="home-directory"
        aria-label={t("このサイトの内容", "What's on this site")}
      >
        <p className="home-directory-title" aria-hidden="true">
          {t("目次", "Contents")}
        </p>
        <ol>
          {directory.map((entry) => (
            <li key={entry.href}>
              <a
                href={toLocalePath(
                  entry.href,
                  entry.japaneseOnly ? "ja" : locale
                )}
                hrefLang={entry.japaneseOnly && en ? "ja" : undefined}
              >
                <span className="home-directory-label">
                  {entry.label}
                  {en && entry.japaneseOnly ? (
                    <small className="site-link-language">JA</small>
                  ) : null}
                </span>
                <span className="home-directory-count">{entry.count}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
