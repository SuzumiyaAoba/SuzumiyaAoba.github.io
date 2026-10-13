import { SiteLayout } from "@/widgets/site-layout";
import { JsonLd } from "@/shared/ui/seo";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  resolveLocale,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { audioEquipment } from "../model/equipment";
import { AudioViewer } from "./audio-viewer";
import { EquipmentArticle } from "./equipment-article";

export default function AudioPage({
  locale: providedLocale,
}: {
  locale?: Locale;
}) {
  const locale = resolveLocale(providedLocale);
  const ja = locale === "ja";
  const englishUnit = audioEquipment.length === 1 ? "device" : "devices";
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
            <p className="page-lead">
              {ja
                ? "持っているオーディオ機器を、細部まで眺められる3Dモデルとともに紹介します。"
                : "A collection of my audio equipment, with interactive 3D models to explore the details."}
            </p>
          </div>
          <p className="page-count">
            {audioEquipment.length} {ja ? "機器" : englishUnit}
          </p>
        </header>

        <section
          className="space-y-6"
          aria-label={ja ? "オーディオシステム" : "Audio system"}
        >
          <AudioViewer
            model="system"
            name={ja ? "接続全体" : "Connected system"}
            manufacturer="Audio"
            finish="NODE / CG-10M / UD-505 / HA-1A MK2"
            description={
              ja
                ? "NODE（USB-A）→ UD-505（USB-B）→ HA-1A MK2 → ヘッドホン。CG-10M → UD-505。ヘッドホンはアンプ正面左の PHONES A に接続します。"
                : "NODE (USB-A) → UD-505 (USB-B) → HA-1A MK2 → headphones. CG-10M → UD-505. Headphones connect to the front left PHONES A jack."
            }
            locale={locale}
          />
        </section>

        <div className="space-y-16">
          {audioEquipment.map((equipment, index) => (
            <EquipmentArticle
              key={equipment.id}
              equipment={equipment}
              index={index}
              locale={locale}
            />
          ))}
        </div>
      </main>
    </SiteLayout>
  );
}
