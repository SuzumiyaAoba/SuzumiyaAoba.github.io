import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { SeriesDefinition } from "@/entities/series-item";

type HomeSeriesProps = {
  locale: Locale;
  series: SeriesDefinition[];
  postTitles: Record<string, string>;
};

const SERIES_LIMIT = 4;
/** 各連載の目次に並べる回の上限。多い連載は残りを件数で示す。 */
const PART_LIMIT = 4;

/**
 * 連載。一つの連載を一冊の本に見立て、題の下に各回の題を目次として並べる。
 */
export function HomeSeries({ locale, series, postTitles }: HomeSeriesProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);
  if (series.length === 0) {
    return null;
  }

  return (
    <section
      className="home-section site-container"
      aria-labelledby="series-title"
    >
      <div className="section-heading">
        <h2 id="series-title" className="section-title">
          {t("連載", "Series")}
        </h2>
        <a href={toLocalePath("/series", locale)} className="arrow-link">
          {t("連載の一覧", "All series")}
        </a>
      </div>
      <ul className="home-series">
        {series.slice(0, SERIES_LIMIT).map((item) => {
          const parts = item.posts.flatMap((slug, index) => {
            const title = postTitles[slug];
            return title ? [{ slug, title, number: index + 1 }] : [];
          });
          const hiddenParts = item.posts.length - PART_LIMIT;
          return (
            <li key={item.slug}>
              <article>
                <p className="home-series-count">
                  {t(
                    `全 ${item.posts.length} 回`,
                    `${item.posts.length} parts`
                  )}
                </p>
                <h3 className="home-series-title">
                  <a href={toLocalePath(`/series/${item.slug}`, locale)}>
                    {item.name}
                  </a>
                </h3>
                {item.description ? (
                  <p className="home-series-description">{item.description}</p>
                ) : null}
                {parts.length > 0 ? (
                  <ol className="home-series-parts">
                    {parts.slice(0, PART_LIMIT).map((part) => (
                      <li key={part.slug}>
                        <a
                          href={toLocalePath(`/blog/post/${part.slug}`, locale)}
                        >
                          <span className="home-series-number">
                            {part.number}
                          </span>
                          <span>{part.title}</span>
                        </a>
                      </li>
                    ))}
                    {hiddenParts > 0 ? (
                      <li className="home-series-more">
                        {t(`ほか ${hiddenParts} 回`, `and ${hiddenParts} more`)}
                      </li>
                    ) : null}
                  </ol>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
