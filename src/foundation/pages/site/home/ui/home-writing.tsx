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

/** 最新記事に添えるタグの上限 */
const LEAD_TAG_LIMIT = 4;

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

/**
 * 新着記事。最新の 1 本を左に大きく組み、残りは縦罫の右に題だけを並べる。
 */
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
  // カテゴリと同じ名前のタグは見出し上の分類と重なるため省く。
  const leadTags = (lead?.tags ?? [])
    .filter((tag) => tag !== lead?.category)
    .slice(0, LEAD_TAG_LIMIT);

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
            {leadTags.length > 0 ? (
              <ul className="home-lead-tags" aria-label={t("タグ", "Tags")}>
                {leadTags.map((tag) => (
                  <li key={tag}>
                    <a
                      href={toLocalePath(
                        `/tags/${encodeURIComponent(tag)}`,
                        locale
                      )}
                    >
                      #{tag}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
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
