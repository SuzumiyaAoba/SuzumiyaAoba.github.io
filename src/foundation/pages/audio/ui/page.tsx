import { SiteLayout } from "@/widgets/site-layout";
import { JsonLd } from "@/shared/ui/seo";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  resolveLocale,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { audioEquipment, AudioSystem, EquipmentTabs } from "@/shared/ui/audio";

export default function AudioPage({
  locale: providedLocale,
}: {
  locale?: Locale;
}) {
  const locale = resolveLocale(providedLocale);
  const ja = locale === "ja";
  const englishUnit = audioEquipment.length === 1 ? "product" : "products";
  const breadcrumbs = buildListBreadcrumbItems(locale, {
    name: ja ? "オーディオ" : "Audio",
    path: "/audio",
  });

  return (
    <SiteLayout locale={locale} path={toLocalePath("/audio", locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <header className="page-heading">
          <div>
            <p className="page-eyebrow">Audio</p>
            <h1 className="page-title">{ja ? "オーディオ" : "My audio"}</h1>
          </div>
          <p className="page-count">
            {audioEquipment.length} {ja ? "製品" : englishUnit}
          </p>
        </header>

        <section
          className="space-y-6"
          aria-label={ja ? "オーディオシステム" : "Audio system"}
        >
          <AudioSystem locale={locale} />
        </section>

        <EquipmentTabs locale={locale} />
      </main>
    </SiteLayout>
  );
}
