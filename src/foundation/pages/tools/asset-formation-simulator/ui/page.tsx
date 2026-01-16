import { Suspense } from "react";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import AssetFormationSimulatorClient from "./asset-formation-simulator-client";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: "資産形成シミュレーション", path: "/tools/asset-formation-simulator" },
        ])}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="lang-ja">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Tools", path: "/tools" },
              { name: "資産形成シミュレーション", path: "/tools/asset-formation-simulator" },
            ]}
          />
        </div>
        <div className="lang-en">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Tools", path: "/tools" },
              { name: "Asset Formation Simulator", path: "/tools/asset-formation-simulator" },
            ]}
          />
        </div>
      </div>
      <Suspense>
        <AssetFormationSimulatorClient />
      </Suspense>
      <Footer />
    </div>
  );
}
