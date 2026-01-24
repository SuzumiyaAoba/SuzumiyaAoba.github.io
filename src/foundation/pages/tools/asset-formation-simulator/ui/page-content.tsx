import { Suspense } from "react";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import AssetFormationSimulatorClient from "./asset-formation-simulator-client";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";

export type AssetFormationSimulatorPageContentProps = {
  locale: Locale;
};

export function AssetFormationSimulatorPageContent({ locale }: AssetFormationSimulatorPageContentProps) {
  const pagePath = toLocalePath("/tools/asset-formation-simulator", locale);
  const pageName = locale === "en" ? "Asset Formation Simulator" : "資産形成シミュレーション";
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Tools", path: toLocalePath("/tools", locale) },
          { name: pageName, path: pagePath },
        ])}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", locale) },
            { name: "Tools", path: toLocalePath("/tools", locale) },
            { name: pageName, path: pagePath },
          ]}
        />
      </div>
      <Suspense>
        <AssetFormationSimulatorClient locale={locale} />
      </Suspense>
      <Footer locale={locale} />
    </div>
  );
}
