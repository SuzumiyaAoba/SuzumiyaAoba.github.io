import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Arrow } from "./home-arrow";
import type { SeriesDefinition } from "@/entities/series-item";

type HomeSeriesProps = { locale: Locale; series: SeriesDefinition[] };

export function HomeSeries({ locale, series }: HomeSeriesProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);
  if (series.length === 0) {
    return null;
  }

  return (
    <section className="home-series" aria-labelledby="series-title">
      <div className="site-container">
        <div className="home-section-heading">
          <h2 id="series-title" className="home-section-title">
            {t("連載", "Series")}
          </h2>
          <a
            href={toLocalePath("/series", locale)}
            className="home-inline-link"
          >
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
  );
}
