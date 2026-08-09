import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { type SimpleEntryListItem } from "@/shared/ui/simple-entry-list";
import { SimpleIndexPageContent } from "@/shared/ui/simple-index-page-content";

export type ToolsIndexPageContentProps = {
  locale: Locale;
};

export function ToolsIndexPageContent({ locale }: ToolsIndexPageContentProps) {
  const pagePath = toLocalePath("/tools", locale);
  const items: SimpleEntryListItem[] = [
    {
      slug: "ascii-standard-code",
      title: "ASCII Standard Code",
      href: toLocalePath("/tools/ascii-standard-code/", locale),
    },
    {
      slug: "asset-formation-simulator",
      title: locale === "en" ? "Asset Formation Simulator" : "資産形成シミュレーション",
      href: toLocalePath("/tools/asset-formation-simulator/", locale),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <SimpleIndexPageContent
        locale={locale}
        path="/tools"
        breadcrumbName="Tools"
        heading={{ ja: "ツール", en: "Tools" }}
        emptyMessage={{ ja: "ツールがありません。", en: "No tools yet." }}
        items={items}
      />
      <Footer locale={locale} />
    </div>
  );
}
