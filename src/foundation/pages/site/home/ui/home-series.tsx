import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { SeriesDefinition } from "@/entities/series-item";

type HomeSeriesProps = { locale: Locale; series: SeriesDefinition[] };

const SERIES_LIMIT = 4;

export function HomeSeries({ locale, series }: HomeSeriesProps) {
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
          <span aria-hidden="true">→</span>
        </a>
      </div>
      <ul className="home-series">
        {series.slice(0, SERIES_LIMIT).map((item) => (
          <li key={item.slug}>
            <article className="home-series-item">
              <p className="home-series-count">
                {t(`全 ${item.posts.length} 回`, `${item.posts.length} parts`)}
              </p>
              <h3 className="home-series-title">
                <a
                  href={toLocalePath(`/series/${item.slug}`, locale)}
                  className="stretched-link"
                >
                  {item.name}
                </a>
              </h3>
              {item.description ? (
                <p className="home-series-description">{item.description}</p>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
