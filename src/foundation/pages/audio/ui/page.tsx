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
import { EquipmentTabs } from "./equipment-tabs";

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
          <AudioViewer
            model="system"
            name={ja ? "接続全体" : "Connected system"}
            manufacturer="Audio"
            finish="NODE / CG-10M / UD-505 / HA-1A MK2"
            description={
              ja
                ? "NODE（USB-A）→ AudioQuest Cinnamon USB 2.0 A–B 1.5m（USB2/CIN/1.5）→ UD-505（USB-B）。CG-10M → サイバーシャフト 50Ω BNCセミリジッドケーブル → UD-505。HD 800 S と Clear Mg Professional は HA-1A MK2 正面左の PHONES A（6.35 mm）に、IE 600 は UD-505 正面の 4.4 mm バランス出力に接続します。"
                : "NODE (USB-A) → AudioQuest Cinnamon USB 2.0 A–B 1.5m (USB2/CIN/1.5) → UD-505 (USB-B). CG-10M → Cybershaft 50Ω BNC semi-rigid cable → UD-505. HD 800 S and Clear Mg Professional connect through HA-1A MK2’s front left PHONES A (6.35 mm) jack; IE 600 connects to UD-505’s front 4.4 mm balanced output."
            }
            locale={locale}
          />
        </section>

        <EquipmentTabs locale={locale} />
      </main>
    </SiteLayout>
  );
}
