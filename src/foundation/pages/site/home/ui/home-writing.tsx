import { resolveLocalizedValue, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Arrow } from "./home-arrow";
import type { LocalizedBlogPostSummary } from "@/entities/blog";

type HomeWritingProps = {
  locale: Locale;
  latestPosts: LocalizedBlogPostSummary[];
  postCount: number;
};

export function HomeWriting({
  locale,
  latestPosts,
  postCount,
}: HomeWritingProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);
  const posts = latestPosts.flatMap((variant) => {
    const post = resolveLocalizedValue(variant, locale);
    return post ? [{ ...post.frontmatter, slug: variant.slug }] : [];
  });
  const [featured, ...otherPosts] = posts;
  const recentPosts = otherPosts.slice(0, 2);
  const earlierPosts = otherPosts.slice(2, 5);

  return (
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
        <div
          className={`home-lead-grid${recentPosts.length === 0 ? " home-lead-solo" : ""}`}
        >
          <article className="home-feature">
            <a
              href={toLocalePath(`/blog/post/${featured.slug}`, locale)}
              className="home-feature-link"
            >
              <div className="home-feature-meta">
                <span>{t("最新の記事", "Latest entry")}</span>
                {featured.date && (
                  <time dateTime={featured.date}>
                    {featured.date.replaceAll("-", ".")}
                  </time>
                )}
              </div>
              <div className="home-feature-copy">
                {featured.category && (
                  <p className="home-feature-category">{featured.category}</p>
                )}
                <h3 className="home-feature-title">{featured.title}</h3>
                {featured.description && (
                  <p className="home-feature-description">
                    {featured.description}
                  </p>
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
                          <time dateTime={post.date}>
                            {post.date.replaceAll("-", ".")}
                          </time>
                        )}
                        {post.category && <span>{post.category}</span>}
                      </div>
                      <h3>{post.title}</h3>
                      {post.description && (
                        <p className="home-entry-description">
                          {post.description}
                        </p>
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
        <p className="home-empty">
          {t("記事はまだありません。", "No articles yet.")}
        </p>
      )}

      {earlierPosts.length > 0 && (
        <ol className="home-earlier-list">
          {earlierPosts.map((post) => (
            <li key={post.slug}>
              <a href={toLocalePath(`/blog/post/${post.slug}`, locale)}>
                <div className="home-entry-meta">
                  {post.date && (
                    <time dateTime={post.date}>
                      {post.date.replaceAll("-", ".")}
                    </time>
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
  );
}
