import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { formatDate, toIntlLocaleTag } from "@/shared/lib/presentation";
import { toPostIndexEntries } from "@/entities/blog";
import type { LocalizedBlogPostSummary, PostIndexEntry } from "@/entities/blog";

type HomeWritingProps = {
  locale: Locale;
  latestPosts: LocalizedBlogPostSummary[];
  postCount: number;
};

function EntryMeta({ post, locale }: { post: PostIndexEntry; locale: Locale }) {
  return (
    <p className="home-entry-meta">
      {post.date ? (
        <time dateTime={post.date}>
          {formatDate(post.date, toIntlLocaleTag(locale))}
        </time>
      ) : null}
      {post.category ? <span>{post.category}</span> : null}
    </p>
  );
}

export function HomeWriting({
  locale,
  latestPosts,
  postCount,
}: HomeWritingProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);
  const [lead, ...rest] = toPostIndexEntries(latestPosts, locale);
  const hrefOf = (post: PostIndexEntry) =>
    toLocalePath(`/blog/post/${post.slug}`, locale);

  return (
    <section
      id="writing"
      className="home-section site-container"
      aria-labelledby="writing-title"
    >
      <div className="section-heading">
        <h2 id="writing-title" className="section-title">
          {t("最新の記事", "Latest articles")}
        </h2>
        <a href={toLocalePath("/blog", locale)} className="arrow-link">
          {t(`すべての記事（${postCount}）`, `All ${postCount} articles`)}
          <span aria-hidden="true">→</span>
        </a>
      </div>
      {lead ? (
        <div className="home-latest">
          <article className="home-lead">
            <EntryMeta post={lead} locale={locale} />
            <h3 className="home-lead-title">
              <a href={hrefOf(lead)} className="stretched-link">
                {lead.title}
              </a>
            </h3>
            {lead.description ? (
              <p className="home-lead-description">{lead.description}</p>
            ) : null}
            <span className="home-lead-more" aria-hidden="true">
              {t("続きを読む", "Read article")} →
            </span>
          </article>
          {rest.length > 0 && (
            <ol className="home-recent">
              {rest.map((post) => (
                <li key={post.slug}>
                  <article className="home-entry">
                    <EntryMeta post={post} locale={locale} />
                    <h3 className="home-entry-title">
                      <a href={hrefOf(post)} className="stretched-link">
                        {post.title}
                      </a>
                    </h3>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : (
        <p className="empty-state">
          {t("記事はまだありません。", "No articles yet.")}
        </p>
      )}
    </section>
  );
}
