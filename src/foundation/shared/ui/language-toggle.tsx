"use client";

import { Button } from "@/shared/ui/button";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

type LanguageToggleProps = {
  locale: Locale;
  path: string;
};

export function LanguageToggle({ locale, path }: LanguageToggleProps) {
  const jaPath = toLocalePath(path, "ja");
  const enPath = toLocalePath(path, "en");

  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <Button
        asChild
        variant="ghost"
        size="sm"
        aria-pressed={locale === "ja"}
        className={`rounded-none bg-transparent px-0 text-xs font-semibold uppercase tracking-[0.2em] ${
          locale === "ja" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        <a href={jaPath}>JA</a>
      </Button>
      <span className="text-border/70">/</span>
      <Button
        asChild
        variant="ghost"
        size="sm"
        aria-pressed={locale === "en"}
        className={`rounded-none bg-transparent px-0 text-xs font-semibold uppercase tracking-[0.2em] ${
          locale === "en" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        <a href={enPath}>EN</a>
      </Button>
    </div>
  );
}
