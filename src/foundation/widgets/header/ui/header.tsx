"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui/icon-client";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { href: "/blog", label: "Blog" },
  { href: "/notes", label: "Notes" },
  { href: "/series", label: "Series" },
  { href: "/books", label: "Books" },
  { href: "/tags", label: "Tags" },
  { href: "/archive", label: "Archive" },
  { href: "/awesome-something", label: "Awesome" },
];

type HeaderProps = {
  locale: Locale;
  path: string;
};

export function Header({ locale, path }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const en = locale === "en";
  const searchLabel = en ? "Search" : "検索";
  const currentPath = toLocalePath(path, "ja").replace(/\/$/, "");
  const isActive = (href: string) =>
    currentPath === href ||
    currentPath.startsWith(`${href}/`) ||
    (href === "/archive" && (currentPath === "/tools" || currentPath.startsWith("/tools/")));

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (!progressBarRef.current) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
      progressBarRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onResize = () => {
      if (desktop.matches) setIsMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [isMenuOpen]);

  const navLink = (item: (typeof navItems)[number], mobile = false) => (
    <a
      key={item.href}
      href={toLocalePath(item.href, locale)}
      aria-current={isActive(item.href) ? "page" : undefined}
      className={cn(
        "site-nav-link inline-flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors",
        isActive(item.href) ? "font-semibold text-foreground" : "text-muted-foreground",
        mobile && "justify-between",
      )}
      onClick={() => setIsMenuOpen(false)}
    >
      {item.label}
      {mobile && <Icon icon="lucide:chevron-right" className="size-3.5" aria-hidden="true" />}
    </a>
  );

  return (
    <header
      ref={headerRef}
      className="site-header sticky top-0 z-50 bg-background/95 backdrop-blur-md"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          setIsMenuOpen(false);
        }
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5" aria-hidden="true">
        <div
          ref={progressBarRef}
          className="reading-progress h-full origin-left transition-transform duration-150 ease-out"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      <div className="site-container flex min-h-20 items-center justify-between gap-2 py-3 sm:gap-4">
        <a
          href={toLocalePath("/", locale)}
          className="site-wordmark flex min-h-11 min-w-0 items-center gap-2.5 rounded-sm text-sm font-semibold leading-relaxed sm:gap-3"
        >
          <span className="brand-spark" aria-hidden="true">
            ✳
          </span>
          <span>{SITE_TITLE}</span>
        </a>

        <nav
          aria-label={en ? "Main navigation" : "メインナビゲーション"}
          className="hidden items-center gap-0.5 whitespace-nowrap xl:flex"
        >
          {navItems.map((item) => navLink(item))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          <a
            href={toLocalePath("/about", locale)}
            aria-current={isActive("/about") ? "page" : undefined}
            className={cn(
              "site-nav-link mr-2 hidden min-h-11 items-center rounded-lg px-3 text-sm transition-colors xl:inline-flex",
              isActive("/about") ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            About
          </a>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-11 rounded-lg text-muted-foreground"
            aria-label={searchLabel}
            title={searchLabel}
          >
            <a
              href={toLocalePath("/search", locale)}
              aria-current={isActive("/search") ? "page" : undefined}
            >
              <Icon icon="lucide:search" className="size-4" aria-hidden="true" />
            </a>
          </Button>
          <div className="hidden items-center gap-0.5 xl:flex">
            <LanguageToggle locale={locale} path={path} />
            <ThemeToggle />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted xl:hidden"
            aria-label={
              isMenuOpen
                ? en
                  ? "Close menu"
                  : "メニューを閉じる"
                : en
                  ? "Open menu"
                  : "メニューを開く"
            }
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <Icon
              icon={isMenuOpen ? "lucide:x" : "lucide:menu"}
              className="size-5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      <div
        id="mobile-nav"
        inert={!isMenuOpen}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 xl:hidden",
          isMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain bg-muted/60">
            <div className="site-container py-4">
              <nav
                aria-label={en ? "Main navigation" : "メインナビゲーション"}
                className="grid grid-cols-2 gap-2"
              >
                {navItems.map((item) => navLink(item, true))}
                {navLink({ href: "/about", label: "About" }, true)}
              </nav>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-background/70 p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{en ? "Theme" : "テーマ"}</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center gap-2">
                  <span>{en ? "Language" : "言語"}</span>
                  <LanguageToggle locale={locale} path={path} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
