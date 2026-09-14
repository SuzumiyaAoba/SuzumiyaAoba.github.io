import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { getBlogPostSummariesVariants, getBlogTagIndex } from "@/entities/blog";
import type { LocalizedBlogPostSummary } from "@/entities/blog";
import { getNoteSummariesVariants } from "@/entities/note";
import { getSeriesList } from "@/entities/series-item";
import type { SeriesDefinition } from "@/entities/series-item";
import { JsonLd } from "@/shared/ui/seo";
import {
  buildBreadcrumbList,
  resolveLocalizedValue,
  toLocalePath,
  resolveLocale,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site";

type PageProps = { locale?: Locale };
type HomeNote = { slug: string; title: string };
type HomeTopic = { name: string; count: number };

export type HomePageContentProps = {
  locale: Locale;
  latestPosts: LocalizedBlogPostSummary[];
  postCount?: number;
  series?: SeriesDefinition[];
  notes?: HomeNote[];
  topics?: HomeTopic[];
};

function Arrow({ className = "" }: { className?: string }) {
  return (
    <span className={`home-arrow ${className}`} aria-hidden="true">
      ↗
    </span>
  );
}

const EMPTY_SERIES: SeriesDefinition[] = [];
const EMPTY_NOTES: HomeNote[] = [];
const EMPTY_TOPICS: HomeTopic[] = [];

export function HomePageContent({
  locale,
  latestPosts,
  postCount = latestPosts.length,
  series = EMPTY_SERIES,
  notes = EMPTY_NOTES,
  topics = EMPTY_TOPICS,
}: HomePageContentProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);
  const pagePath = toLocalePath("/", locale);
  const posts = latestPosts.flatMap((variant) => {
    const post = resolveLocalizedValue(variant, locale);
    return post ? [{ ...post.frontmatter, slug: variant.slug }] : [];
  });
  const [featured, ...otherPosts] = posts;
  const recentPosts = otherPosts.slice(0, 2);
  const earlierPosts = otherPosts.slice(2, 5);
  const tools = [
    {
      href: "/tools/ascii-standard-code",
      name: t("ASCII コード表", "ASCII reference"),
      description: t("文字コードとビットの対応表", "Character codes and their binary values"),
    },
    {
      href: "/tools/asset-formation-simulator",
      name: t("資産形成シミュレーター", "Savings simulator"),
      description: t(
        "積立額・利回り・期間から資産の推移を計算",
        "Calculate growth from contributions, return, and duration",
      ),
    },
  ];

  return (
    <div className="site-page">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: pagePath }])} />
      <main className="home-main" id="main-content">
        <header className="home-intro site-container">
          <div className="home-intro-title">
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
                {notes.length}
                <span>{t("件", "notes")}</span>
              </span>
              <Arrow />
            </a>
            <a href={toLocalePath("/series", locale)}>
              <span>{t("連載", "Series")}</span>
              <span className="home-overview-count">
                {series.length}
                <span>{t("件", "series")}</span>
              </span>
              <Arrow />
            </a>
          </nav>
          {topics.length > 0 && (
            <nav className="home-topics" aria-label={t("タグから記事を探す", "Browse by tag")}>
              <span className="home-topics-label">{t("タグ", "Tags")}</span>
              {topics.map((topic) => (
                <a
                  key={topic.name}
                  href={toLocalePath(`/tags/${encodeURIComponent(topic.name)}`, locale)}
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

        <section
          id="writing"
          className="home-writing site-container"
          aria-labelledby="writing-title"
        >
          <div className="home-section-heading">
            <h2 id="writing-title" className="home-section-title">
              {t("最新の記事", "Latest articles")}
            </h2>
            <a href={toLocalePath("/blog", locale)} className="home-inline-link">
              {t("すべての記事", "All articles")}
              <span className="home-small-count">{postCount}</span>
              <Arrow />
            </a>
          </div>
          {featured ? (
            <div className={`home-lead-grid${recentPosts.length === 0 ? " home-lead-solo" : ""}`}>
              <article className="home-feature">
                <a
                  href={toLocalePath(`/blog/post/${featured.slug}`, locale)}
                  className="home-feature-link"
                >
                  <div className="home-feature-meta">
                    <span>{t("最新の記事", "Latest entry")}</span>
                    {featured.date && (
                      <time dateTime={featured.date}>{featured.date.replaceAll("-", ".")}</time>
                    )}
                  </div>
                  <div className="home-feature-copy">
                    {featured.category && (
                      <p className="home-feature-category">{featured.category}</p>
                    )}
                    <h3 className="home-feature-title">{featured.title}</h3>
                    {featured.description && (
                      <p className="home-feature-description">{featured.description}</p>
                    )}
                  </div>
                  <div className="home-feature-footer">
                    <span>{t("続きを読む", "Read the article")}</span>
                    <Arrow />
                  </div>
                </a>
              </article>
              {recentPosts.length > 0 && (
                <ol className="home-recent-list">
                  {recentPosts.map((post) => (
                    <li key={post.slug}>
                      <article className="home-recent">
                        <a
                          href={toLocalePath(`/blog/post/${post.slug}`, locale)}
                          className="home-recent-link"
                        >
                          <div className="home-entry-meta">
                            {post.date && (
                              <time dateTime={post.date}>{post.date.replaceAll("-", ".")}</time>
                            )}
                            {post.category && <span>{post.category}</span>}
                          </div>
                          <h3>{post.title}</h3>
                          {post.description && (
                            <p className="home-entry-description">{post.description}</p>
                          )}
                          <span className="home-recent-footer">
                            {t("記事を読む", "Read article")}
                            <Arrow />
                          </span>
                        </a>
                      </article>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : (
            <p className="home-empty">{t("記事はまだありません。", "No articles yet.")}</p>
          )}

          {earlierPosts.length > 0 && (
            <ol className="home-earlier-list">
              {earlierPosts.map((post) => (
                <li key={post.slug}>
                  <a href={toLocalePath(`/blog/post/${post.slug}`, locale)}>
                    <div className="home-entry-meta">
                      {post.date && (
                        <time dateTime={post.date}>{post.date.replaceAll("-", ".")}</time>
                      )}
                      {post.category && <span>{post.category}</span>}
                    </div>
                    <h3>{post.title}</h3>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>

        {series.length > 0 && (
          <section className="home-series" aria-labelledby="series-title">
            <div className="site-container">
              <div className="home-section-heading">
                <h2 id="series-title" className="home-section-title">
                  {t("連載", "Series")}
                </h2>
                <a href={toLocalePath("/series", locale)} className="home-inline-link">
                  {t("連載の一覧", "All series")}
                  <Arrow />
                </a>
              </div>
              <ul className="home-series-list">
                {series.slice(0, 4).map((item) => (
                  <li key={item.slug}>
                    <a
                      href={toLocalePath(`/series/${item.slug}`, locale)}
                      className="home-series-link"
                    >
                      <span className="home-series-count">
                        {item.posts.length}
                        <span>{t("記事", "articles")}</span>
                      </span>
                      <h3>{item.name}</h3>
                      {item.description && <p>{item.description}</p>}
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="home-library site-container" aria-labelledby="library-title">
          <div className="home-library-notes">
            <div className="home-section-heading">
              <h2 id="library-title" className="home-section-title">
                {t("ノート", "Notes")}
              </h2>
              <a href={toLocalePath("/notes", locale)} className="home-inline-link">
                {t("すべて", "All notes")}
                <Arrow />
              </a>
            </div>
            {notes.length > 0 ? (
              <ul className="home-note-list">
                {notes.slice(0, 4).map((note) => (
                  <li key={note.slug}>
                    <a href={toLocalePath(`/notes/${note.slug}`, locale)}>
                      <span>{note.title}</span>
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-empty">{t("ノートはまだありません。", "No notes yet.")}</p>
            )}
            <a href="/books/" hrefLang="ja" className="home-books-link">
              <span>{t("書籍一覧", "Books (Japanese)")}</span>
              <Arrow />
            </a>
          </div>
          <aside className="home-toolbox" aria-labelledby="toolbox-title">
            <h2 id="toolbox-title" className="home-section-title">
              {t("ツール", "Tools")}
            </h2>
            <ul>
              {tools.map((tool) => (
                <li key={tool.href}>
                  <a href={toLocalePath(tool.href, locale)}>
                    <span>
                      <strong>{tool.name}</strong>
                      <span className="home-tool-description">{tool.description}</span>
                    </span>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ul>
            <a href={toLocalePath("/archive", locale)} className="home-inline-link">
              {t("資料とツールの一覧", "Archive")}
              <Arrow />
            </a>
          </aside>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const [posts, series, notes, tagIndex] = await Promise.all([
    getBlogPostSummariesVariants(),
    getSeriesList(resolvedLocale),
    getNoteSummariesVariants(),
    getBlogTagIndex(resolvedLocale),
  ]);
  const topics = ["Java", "Scala", "Nix", "AI", "関数型プログラミング"].flatMap((name) => {
    const count = tagIndex.get(name)?.length ?? 0;
    return count > 0 ? [{ name, count }] : [];
  });

  return (
    <HomePageContent
      locale={resolvedLocale}
      latestPosts={posts.slice(0, 6)}
      postCount={posts.length}
      series={series.filter((item) => item.posts.length > 0)}
      notes={notes.flatMap((variant) => {
        const note = resolveLocalizedValue(variant, resolvedLocale);
        return note ? [{ slug: variant.slug, title: note.frontmatter.title || variant.slug }] : [];
      })}
      topics={topics}
    />
  );
}
