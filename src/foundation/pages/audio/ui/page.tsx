import { ArrowUpRight } from "lucide-react";
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

        <div className="space-y-16">
          {audioEquipment.map((equipment, index) => (
            <article
              key={equipment.id}
              id={equipment.id}
              className="space-y-8"
              aria-labelledby={`${equipment.id}-title`}
            >
              <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                  <p className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {equipment.manufacturer}
                  </p>
                  <h2
                    id={`${equipment.id}-title`}
                    className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl"
                  >
                    {equipment.name}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {equipment.category[locale]} · {equipment.finish[locale]}
                </p>
              </header>

              {equipment.model && (
                <AudioViewer
                  model={equipment.model}
                  name={equipment.name}
                  manufacturer={equipment.manufacturer}
                  finish={equipment.finish[locale]}
                  description={equipment.description[locale]}
                  locale={locale}
                />
              )}

              <div className="grid gap-8 border-t border-rule pt-8 md:grid-cols-2 md:gap-12">
                <div className="space-y-5">
                  <h3 className="section-label">
                    {ja ? "この機器について" : "About this device"}
                  </h3>
                  <p className="text-sm leading-loose text-foreground">
                    {equipment.description[locale]}
                  </p>
                  <p className="text-sm leading-loose text-muted-foreground">
                    {equipment.details[locale]}
                  </p>
                  <ul className="space-y-3 pt-2 text-sm">
                    {equipment.sources.map((source) => (
                      <li key={source.href}>
                        <a
                          className="inline-flex items-center gap-1.5 text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                          href={source.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.title[locale]}
                          <ArrowUpRight
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 section-label">
                    {ja ? "仕様" : "Specifications"}
                  </h3>
                  <dl className="divide-y divide-rule text-sm">
                    {equipment.specifications.map((specification) => (
                      <div
                        key={specification.label.en}
                        className="grid grid-cols-2 gap-4 py-3 first:pt-0"
                      >
                        <dt className="text-muted-foreground">
                          {specification.label[locale]}
                        </dt>
                        <dd className="leading-relaxed">
                          {specification.value[locale]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </SiteLayout>
  );
}
