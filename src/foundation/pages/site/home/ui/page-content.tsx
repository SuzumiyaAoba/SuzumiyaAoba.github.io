import { SiteLayout } from "@/widgets/site-layout";
import type { LocalizedBlogPostSummary } from "@/entities/blog";
import type { SeriesDefinition } from "@/entities/series-item";
import { JsonLd } from "@/shared/ui/seo";
import { buildBreadcrumbList, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { HomeTopic } from "../model/home-content";
import { HomeIntro } from "./home-intro";
import { HomeWriting } from "./home-writing";
import { HomeSeries } from "./home-series";
import { HomeExplore } from "./home-explore";

export type HomePageContentProps = {
  locale: Locale;
  latestPosts: LocalizedBlogPostSummary[];
  postCount?: number;
  keywordCount: number;
  /** 書籍の冊数。目次の件数に使う。 */
  bookCount?: number;
  series?: SeriesDefinition[];
  /** 記事のスラッグから表示言語の題を引く表。連載の各回の題に使う。 */
  postTitles?: Record<string, string>;
  topics?: HomeTopic[];
};

const EMPTY_SERIES: SeriesDefinition[] = [];
const EMPTY_TOPICS: HomeTopic[] = [];
const EMPTY_TITLES: Record<string, string> = {};

export function HomePageContent({
  locale,
  latestPosts,
  postCount = latestPosts.length,
  keywordCount,
  bookCount = 1,
  series = EMPTY_SERIES,
  postTitles = EMPTY_TITLES,
  topics = EMPTY_TOPICS,
}: HomePageContentProps) {
  const pagePath = toLocalePath("/", locale);

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: pagePath }])} />
      <main className="home-main">
        <HomeIntro
          locale={locale}
          postCount={postCount}
          keywordCount={keywordCount}
          seriesCount={series.length}
          bookCount={bookCount}
        />
        <HomeWriting
          locale={locale}
          latestPosts={latestPosts}
          postCount={postCount}
        />
        <HomeSeries locale={locale} series={series} postTitles={postTitles} />
        <HomeExplore
          locale={locale}
          topics={topics}
          keywordCount={keywordCount}
        />
      </main>
    </SiteLayout>
  );
}
