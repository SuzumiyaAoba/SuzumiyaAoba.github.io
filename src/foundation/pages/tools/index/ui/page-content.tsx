import { SiteLayout } from "@/widgets/site-layout";
import { buildDetailBreadcrumbItems, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { SimpleEntryListItem } from "@/shared/ui/simple-entry-list";
import { SimpleIndexPageContent } from "@/shared/ui/simple-index-page-content";

export type ToolsIndexPageContentProps = {
  locale: Locale;
};

export function ToolsIndexPageContent({ locale }: ToolsIndexPageContentProps) {
  const pagePath = toLocalePath("/tools", locale);
  const breadcrumbItems = buildDetailBreadcrumbItems(
    locale,
    { name: "Archive", path: "/archive" },
    { name: "Tools", path: pagePath }
  );
  const items: SimpleEntryListItem[] = [
    {
      slug: "ascii-standard-code",
      title: "ASCII Standard Code",
      href: toLocalePath("/tools/ascii-standard-code/", locale),
    },
    {
      slug: "asset-formation-simulator",
      title:
        locale === "en"
          ? "Asset Formation Simulator"
          : "資産形成シミュレーション",
      href: toLocalePath("/tools/asset-formation-simulator/", locale),
    },
  ];

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <SimpleIndexPageContent
        locale={locale}
        path="/tools"
        breadcrumbName="Tools"
        breadcrumbItems={breadcrumbItems}
        heading={{ ja: "ツール", en: "Tools" }}
        emptyMessage={{ ja: "ツールがありません。", en: "No tools yet." }}
        items={items}
      />
    </SiteLayout>
  );
}
