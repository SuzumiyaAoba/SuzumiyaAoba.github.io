"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

const navItems = [
  { href: "/blog", labelJa: "ブログ", labelEn: "Blog" },
  { href: "/series", labelJa: "シリーズ", labelEn: "Series" },
  { href: "/tags", labelJa: "タグ", labelEn: "Tags" },
  { href: "/tools", labelJa: "ツール", labelEn: "Tools" },
];

type HeaderProps = {
  locale: Locale;
  path: string;
};

export function Header({ locale, path }: HeaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      setScrollProgress(progress);
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1">
          <div
            className="h-full origin-left bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${scrollProgress})` }}
          />
        </div>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-b border-border/60 px-6 py-3 md:border-b-0">
          <a href={toLocalePath("/", locale)} className="flex items-center gap-4">
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide text-foreground">NO SEA. I SEE.</p>
            </div>
          </a>

          <nav className="hidden items-center gap-1 rounded-full p-1 text-sm font-medium text-muted-foreground md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={toLocalePath(item.href, locale)}
                className="rounded-full px-4 py-1.5 transition-colors hover:bg-background hover:text-foreground"
              >
                <I18nText locale={locale} ja={item.labelJa} en={item.labelEn} />
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="rounded-none bg-transparent px-0 text-sm font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
            >
              <a href={toLocalePath("/about", locale)}>
                <I18nText locale={locale} ja="概要" en="About" />
              </a>
            </Button>
            <span className="text-border/70">/</span>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="rounded-none bg-transparent px-0 text-sm font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
            >
              <a href={toLocalePath("/search", locale)}>
                <I18nText locale={locale} ja="検索" en="Search" />
              </a>
            </Button>
            <span className="text-border/70">/</span>
            <LanguageToggle locale={locale} path={path} />
            <span className="text-border/70">/</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors"
              aria-label={locale === "en" ? "Open menu" : "メニューを開く"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-0.5 w-full rounded-full bg-current transition-transform duration-200 ${
                    isMenuOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-current transition-opacity duration-200 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-current transition-transform duration-200 ${
                    isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
      <div
        id="mobile-nav"
        className={`mx-auto block max-w-6xl overflow-hidden px-6 transition-[max-height,opacity] duration-300 md:hidden ${
          isMenuOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0 pb-0"
        }`}
      >
        <nav className="flex flex-col gap-3 py-4 text-sm font-medium text-muted-foreground">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={toLocalePath(item.href, locale)}
                className="rounded-lg px-3 py-2 transition-colors hover:bg-background hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                <I18nText locale={locale} ja={item.labelJa} en={item.labelEn} />
              </a>
            ))}
          <div className="h-px bg-border/60" />
          <a
            href={toLocalePath("/about", locale)}
            className="rounded-lg px-3 py-2 transition-colors hover:bg-background hover:text-foreground"
            onClick={() => setIsMenuOpen(false)}
          >
            <I18nText locale={locale} ja="概要" en="About" />
          </a>
          <a
            href={toLocalePath("/search", locale)}
            className="rounded-lg px-3 py-2 transition-colors hover:bg-background hover:text-foreground"
            onClick={() => setIsMenuOpen(false)}
          >
            <I18nText locale={locale} ja="検索" en="Search" />
          </a>
          <div className="h-px bg-border/60" />
          <div className="flex items-center gap-2 px-3 py-2">
            <I18nText locale={locale} as="span" ja="テーマ" en="Theme" className="text-sm" />
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <I18nText locale={locale} as="span" ja="言語" en="Language" className="text-sm" />
            <LanguageToggle locale={locale} path={path} />
          </div>
        </nav>
      </div>
    </header>
  );
}
