import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { HomeTopic } from "../model/home-content";

type HomeExploreProps = {
  locale: Locale;
  topics: HomeTopic[];
  keywordCount: number;
};

type ExploreLink = {
  href: string;
  ja: string;
  en: string;
  japaneseOnly?: boolean;
};

const KEYWORD_PICKS: ExploreLink[] = [
  {
    href: "/keywords/graphics/noise/curl-noise",
    ja: "カールノイズ",
    en: "Curl Noise",
  },
  {
    href: "/keywords/simulation/curves/cubic-hermite-curve",
    ja: "エルミート曲線",
    en: "Cubic Hermite Curve",
  },
  {
    href: "/keywords/graphics/fields/signed-distance-field",
    ja: "符号付き距離場",
    en: "Signed Distance Field",
  },
  {
    href: "/keywords/world/generation/wave-function-collapse",
    ja: "波動関数崩壊",
    en: "Wave Function Collapse",
  },
];

const RESOURCES: ExploreLink[] = [
  { href: "/ai/models", ja: "AIニュース", en: "AI News", japaneseOnly: true },
  {
    href: "/ai/benchmarks",
    ja: "AIベンチマーク",
    en: "AI Benchmarks",
    japaneseOnly: true,
  },
  {
    href: "/tools/ascii-standard-code",
    ja: "ASCII コード表",
    en: "ASCII reference",
  },
  {
    href: "/tools/asset-formation-simulator",
    ja: "資産形成シミュレーター",
    en: "Savings simulator",
  },
  {
    href: "/awesome-something",
    ja: "Awesome Something",
    en: "Awesome Something",
  },
];

/**
 * 探す手がかり。キーワード・資料・テーマを縦罫で区切った三段に組む。
 * キーワードは和名と英名をリーダーでつなぎ、対訳の用語集のように見せる。
 */
export function HomeExplore({
  locale,
  topics,
  keywordCount,
}: HomeExploreProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);

  return (
    <div className="home-explore site-container">
      <section className="home-column" aria-labelledby="keywords-title">
        <h2 id="keywords-title" className="home-column-title">
          {t("キーワード", "Keywords")}
        </h2>
        <ul className="home-glossary">
          {KEYWORD_PICKS.map((keyword) => (
            <li key={keyword.href}>
              <a href={toLocalePath(keyword.href, locale)}>
                {en ? (
                  keyword.en
                ) : (
                  <>
                    <span>{keyword.ja}</span>
                    <span className="home-glossary-gloss" lang="en">
                      {keyword.en}
                    </span>
                  </>
                )}
              </a>
            </li>
          ))}
        </ul>
        <a href={toLocalePath("/keywords", locale)} className="arrow-link">
          {t(
            `すべてのキーワード（${keywordCount}）`,
            `All ${keywordCount} keywords`
          )}
        </a>
      </section>

      <section className="home-column" aria-labelledby="resources-title">
        <h2 id="resources-title" className="home-column-title">
          {t("資料とツール", "Resources & tools")}
        </h2>
        <ul className="link-list">
          {RESOURCES.map((resource) => (
            <li key={resource.href}>
              <a
                href={toLocalePath(
                  resource.href,
                  resource.japaneseOnly ? "ja" : locale
                )}
                hrefLang={resource.japaneseOnly && en ? "ja" : undefined}
              >
                {en ? resource.en : resource.ja}
              </a>
            </li>
          ))}
        </ul>
        <a href={toLocalePath("/archive", locale)} className="arrow-link">
          {t("資料の一覧", "All resources")}
        </a>
      </section>

      {topics.length > 0 && (
        <nav
          className="home-column"
          aria-label={t("タグから記事を探す", "Browse by tag")}
        >
          <h2 className="home-column-title">{t("テーマ", "Topics")}</h2>
          <ul>
            {topics.map((topic) => (
              <li key={topic.name}>
                <a
                  href={toLocalePath(
                    `/tags/${encodeURIComponent(topic.name)}`,
                    locale
                  )}
                  className="leader-link"
                >
                  <span>{topic.name}</span>
                  <span>{topic.count}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href={toLocalePath("/tags", locale)} className="arrow-link">
            {t("すべてのタグ", "All tags")}
          </a>
        </nav>
      )}
    </div>
  );
}
