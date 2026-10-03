import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { HomeTopic } from "../model/home-content";

type HomeExploreProps = { locale: Locale; topics: HomeTopic[] };

type ExploreLink = {
  href: string;
  ja: string;
  en: string;
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
  {
    href: "/archive/ai-news",
    ja: "AIニュース",
    en: "AI News",
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

export function HomeExplore({ locale, topics }: HomeExploreProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);

  return (
    <div className="home-explore site-container">
      <section className="home-column" aria-labelledby="keywords-title">
        <h2 id="keywords-title" className="home-column-title">
          {t("キーワード", "Keywords")}
        </h2>
        <ul className="link-list">
          {KEYWORD_PICKS.map((keyword) => (
            <li key={keyword.href}>
              <a href={toLocalePath(keyword.href, locale)}>
                {en ? keyword.en : keyword.ja}
              </a>
            </li>
          ))}
        </ul>
        <a href={toLocalePath("/keywords", locale)} className="arrow-link">
          {t("すべてのキーワード", "All keywords")}
          <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="home-column" aria-labelledby="resources-title">
        <h2 id="resources-title" className="home-column-title">
          {t("資料とツール", "Resources & tools")}
        </h2>
        <ul className="link-list">
          {RESOURCES.map((resource) => (
            <li key={resource.href}>
              <a href={toLocalePath(resource.href, locale)}>
                {en ? resource.en : resource.ja}
              </a>
            </li>
          ))}
        </ul>
        <a href={toLocalePath("/archive", locale)} className="arrow-link">
          {t("資料の一覧", "All resources")}
          <span aria-hidden="true">→</span>
        </a>
      </section>

      {topics.length > 0 && (
        <nav
          className="home-column"
          aria-label={t("タグから記事を探す", "Browse by tag")}
        >
          <h2 className="home-column-title">{t("テーマ", "Topics")}</h2>
          <ul className="topic-list">
            {topics.map((topic) => (
              <li key={topic.name}>
                <a
                  href={toLocalePath(
                    `/tags/${encodeURIComponent(topic.name)}`,
                    locale
                  )}
                  className="topic-chip"
                >
                  {topic.name}
                  <span className="topic-chip-count">{topic.count}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href={toLocalePath("/tags", locale)} className="arrow-link">
            {t("すべてのタグ", "All tags")}
            <span aria-hidden="true">→</span>
          </a>
        </nav>
      )}
    </div>
  );
}
