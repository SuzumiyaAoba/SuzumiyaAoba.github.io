import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import {
  formatDate,
  formatMonthDay,
  toIntlLocaleTag,
  yearOf,
} from "@/shared/lib/presentation";
import type { PostIndexEntry } from "../model/post-index-entry";

type PostIndexProps = {
  entries: PostIndexEntry[];
  locale: Locale;
  /**
   * timeline: 年ごとにまとめ、行頭に月日を置く（記事一覧・タグ別一覧）
   * numbered: 行頭に通し番号を置く（連載の目次）
   * plain: 行頭に年月日を置く（ホームの新着）
   */
  layout?: "timeline" | "numbered" | "plain";
  /** 記事タイトルの見出しレベル。年見出しを使う timeline では自動的に 1 段下げる。 */
  headingLevel?: "h2" | "h3";
  /** 説明文を表示するかどうか */
  showDescription?: boolean;
  /** タグをリンクとして表示するかどうか */
  showTags?: boolean;
};

function groupByYear(entries: PostIndexEntry[]) {
  const groups: { year: string; entries: PostIndexEntry[] }[] = [];
  for (const entry of entries) {
    const year = yearOf(entry.date ?? "");
    const current = groups.at(-1);
    if (current && current.year === year) {
      current.entries.push(entry);
    } else {
      groups.push({ year, entries: [entry] });
    }
  }
  return groups;
}

type PostRowProps = {
  entry: PostIndexEntry;
  locale: Locale;
  aside: React.ReactNode;
  heading: "h2" | "h3" | "h4";
  showDescription: boolean;
  showTags: boolean;
  dateInMeta: boolean;
};

function PostRow({
  entry,
  locale,
  aside,
  heading: Heading,
  showDescription,
  showTags,
  dateInMeta,
}: PostRowProps) {
  const intlLocale = toIntlLocaleTag(locale);
  // カテゴリと同じ名前のタグは重複して見えるため省く。
  const tags = entry.tags.filter((tag) => tag !== entry.category);
  const hasMeta =
    Boolean(entry.category) ||
    (showTags && tags.length > 0) ||
    (dateInMeta && Boolean(entry.date));

  return (
    <li className="post-row">
      <span className="post-row-aside">{aside}</span>
      <div className="post-row-main">
        <Heading className="post-row-title">
          <a
            href={toLocalePath(`/blog/post/${entry.slug}`, locale)}
            className="post-row-link"
          >
            {entry.title}
          </a>
        </Heading>
        {showDescription && entry.description ? (
          <p className="post-row-description">{entry.description}</p>
        ) : null}
        {hasMeta ? (
          <div className="post-row-meta">
            {dateInMeta && entry.date ? (
              <time dateTime={entry.date}>
                {formatDate(entry.date, intlLocale)}
              </time>
            ) : null}
            {entry.category ? <span>{entry.category}</span> : null}
            {showTags && tags.length > 0 ? (
              <ul className="post-row-tags">
                {tags.map((tag) => (
                  <li key={tag}>
                    <a
                      href={toLocalePath(
                        `/tags/${encodeURIComponent(tag)}`,
                        locale
                      )}
                      className="post-row-tag"
                    >
                      #{tag}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * 記事の一覧。サムネイルや装飾を省き、日付・タイトル・要約の 3 点で素早く拾い読みできるようにする。
 */
export function PostIndex({
  entries,
  locale,
  layout = "timeline",
  headingLevel = "h2",
  showDescription = true,
  showTags = true,
}: PostIndexProps) {
  const intlLocale = toIntlLocaleTag(locale);
  const rowProps = { locale, showDescription, showTags };

  if (layout === "timeline") {
    const YearHeading = headingLevel;
    const titleHeading = headingLevel === "h2" ? "h3" : "h4";
    return (
      <div className="post-index-timeline">
        {groupByYear(entries).map((group) => (
          <section key={group.year || "undated"} className="post-year-group">
            <YearHeading className="post-year">{group.year}</YearHeading>
            <ol className="post-rows">
              {group.entries.map((entry) => (
                <PostRow
                  key={entry.slug}
                  entry={entry}
                  {...rowProps}
                  heading={titleHeading}
                  dateInMeta={false}
                  aside={
                    entry.date ? (
                      <time dateTime={entry.date}>
                        {formatMonthDay(entry.date, intlLocale)}
                      </time>
                    ) : null
                  }
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    );
  }

  return (
    <ol
      className={
        layout === "numbered" ? "post-rows post-index-numbered" : "post-rows"
      }
    >
      {entries.map((entry, index) => (
        <PostRow
          key={entry.slug}
          entry={entry}
          {...rowProps}
          heading={headingLevel}
          dateInMeta={layout === "numbered"}
          aside={
            layout === "numbered" ? (
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
            ) : entry.date ? (
              <time dateTime={entry.date}>
                {formatDate(entry.date, intlLocale)}
              </time>
            ) : null
          }
        />
      ))}
    </ol>
  );
}
