import { Suspense } from "react";
import { SiteLayout } from "@/widgets/site-layout";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { AssetFormationSimulator as AssetFormationSimulatorClient } from "./asset-formation-simulator-client";
import { buildBreadcrumbList, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

export type AssetFormationSimulatorPageContentProps = {
  locale: Locale;
};

export function AssetFormationSimulatorPageContent({
  locale,
}: AssetFormationSimulatorPageContentProps) {
  const pagePath = toLocalePath("/tools/asset-formation-simulator", locale);
  const pageName = locale === "en" ? "Asset Formation Simulator" : "資産形成シミュレーション";
  const breadcrumbItems = [
    { name: "Home", path: toLocalePath("/", locale) },
    { name: "Archive", path: toLocalePath("/archive", locale) },
    { name: "Tools", path: toLocalePath("/tools", locale) },
    { name: pageName, path: pagePath },
  ];
  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <div className="site-container pt-6 sm:pt-8">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <Suspense>
        <AssetFormationSimulatorClient locale={locale} />
      </Suspense>
    </SiteLayout>
  );
}
