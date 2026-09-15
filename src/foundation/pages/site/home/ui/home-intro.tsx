import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Arrow } from "./home-arrow";
import { SITE_TITLE } from "@/shared/lib/site";
import type { HomeTopic } from "../model/home-content";

type HomeIntroProps = {
  locale: Locale;
  postCount: number;
  noteCount: number;
  seriesCount: number;
  topics: HomeTopic[];
};

export function HomeIntro({
  locale,
  postCount,
  noteCount,
  seriesCount,
  topics,
}: HomeIntroProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);

  return (
    <header className="home-intro site-container">
      <div>
        <h1 className="home-headline" lang="la">
          <span>{SITE_TITLE}</span>
        </h1>
      </div>
      <nav className="home-overview" aria-label={t("コンテンツ", "Content")}>
        <a href={toLocalePath("/blog", locale)}>
          <span>{t("ブログ", "Blog")}</span>
          <span className="home-overview-count">
            {postCount}
            <span>{t("記事", "articles")}</span>
          </span>
          <Arrow />
        </a>
        <a href={toLocalePath("/notes", locale)}>
          <span>{t("ノート", "Notes")}</span>
          <span className="home-overview-count">
            {noteCount}
            <span>{t("件", "notes")}</span>
          </span>
          <Arrow />
        </a>
        <a href={toLocalePath("/series", locale)}>
          <span>{t("連載", "Series")}</span>
          <span className="home-overview-count">
            {seriesCount}
            <span>{t("件", "series")}</span>
          </span>
          <Arrow />
        </a>
      </nav>
      {topics.length > 0 && (
        <nav
          className="home-topics"
          aria-label={t("タグから記事を探す", "Browse by tag")}
        >
          <span className="home-topics-label">{t("タグ", "Tags")}</span>
          {topics.map((topic) => (
            <a
              key={topic.name}
              href={toLocalePath(
                `/tags/${encodeURIComponent(topic.name)}`,
                locale
              )}
            >
              <span>{topic.name}</span>
              <span className="home-topic-count">{topic.count}</span>
            </a>
          ))}
          <a
            className="home-topics-all"
            href={toLocalePath("/tags", locale)}
            aria-label={t("すべてのタグ", "All tags")}
          >
            <span aria-hidden="true">→</span>
          </a>
        </nav>
      )}
    </header>
  );
}
