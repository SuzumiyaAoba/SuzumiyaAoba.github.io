import { Suspense } from "react";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import AssetFormationSimulatorClient from "./asset-formation-simulator-client";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";

type PageProps = {
  locale?: Locale;
};

export default function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const pagePath = toLocalePath("/tools/asset-formation-simulator", resolvedLocale);
  const pageName =
    resolvedLocale === "en" ? "Asset Formation Simulator" : "資産形成シミュレーション";
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Tools", path: toLocalePath("/tools", resolvedLocale) },
          { name: pageName, path: pagePath },
        ])}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", resolvedLocale) },
            { name: "Tools", path: toLocalePath("/tools", resolvedLocale) },
            { name: pageName, path: pagePath },
          ]}
        />
      </div>
      <Suspense>
        <AssetFormationSimulatorClient locale={resolvedLocale} />
      </Suspense>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
