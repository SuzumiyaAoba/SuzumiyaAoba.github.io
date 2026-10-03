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
  series?: SeriesDefinition[];
  topics?: HomeTopic[];
};

const EMPTY_SERIES: SeriesDefinition[] = [];
const EMPTY_TOPICS: HomeTopic[] = [];

export function HomePageContent({
  locale,
  latestPosts,
  postCount = latestPosts.length,
  keywordCount,
  series = EMPTY_SERIES,
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
        />
        <HomeWriting
          locale={locale}
          latestPosts={latestPosts}
          postCount={postCount}
        />
        <HomeSeries locale={locale} series={series} />
        <HomeExplore locale={locale} topics={topics} />
      </main>
    </SiteLayout>
  );
}
