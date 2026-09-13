"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui/icon-client";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

const navigationGroups = [
  {
    ja: "読む",
    en: "Read",
    items: [
      { href: "/blog", ja: "記事", en: "Blog" },
      { href: "/notes", ja: "ノート", en: "Notes" },
      { href: "/series", ja: "連載", en: "Series" },
      { href: "/books", ja: "書籍", en: "Books", japaneseOnly: true },
    ],
  },
  {
    ja: "探す",
    en: "Explore",
    items: [
      { href: "/tags", ja: "タグから探す", en: "Browse tags" },
      { href: "/archive", ja: "資料とツール", en: "Archive & tools" },
      { href: "/awesome-something", ja: "Awesome", en: "Awesome" },
    ],
  },
  {
    ja: "このサイト",
    en: "This site",
    items: [
      { href: "/about", ja: "About", en: "About" },
      { href: "/contact", ja: "お問い合わせ", en: "Contact" },
      { href: "/rss.xml", ja: "RSS", en: "RSS" },
    ],
  },
];
const primaryItems = navigationGroups
  .flatMap((group) => group.items)
  .filter((item) => ["/blog", "/notes", "/archive"].includes(item.href));
type NavigationItem = (typeof navigationGroups)[number]["items"][number];
type HeaderProps = { locale: Locale; path: string };

export function Header({ locale, path }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const en = locale === "en";
  const currentPath = toLocalePath(path, "ja").replace(/\/$/, "");
  const isReading =
    currentPath.startsWith("/blog/post/") ||
    currentPath.startsWith("/notes/") ||
    currentPath.startsWith("/books/");
  const isActive = (href: string) =>
    currentPath === href ||
    currentPath.startsWith(`${href}/`) ||
    (href === "/archive" && (currentPath === "/tools" || currentPath.startsWith("/tools/")));

  useEffect(() => {
    if (!isReading) return;
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
  }, [isReading]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target))
        setIsMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isMenuOpen]);

  const navLink = (item: NavigationItem, index = false) => {
    const japaneseOnly = "japaneseOnly" in item && item.japaneseOnly;
    return (
      <a
        key={item.href}
        href={japaneseOnly ? toLocalePath(item.href, "ja") : toLocalePath(item.href, locale)}
        hrefLang={japaneseOnly ? "ja" : undefined}
        aria-current={isActive(item.href) ? "page" : undefined}
        className={cn(
          index ? "site-index-link" : "site-nav-link",
          isActive(item.href) && "font-semibold",
        )}
        onClick={() => setIsMenuOpen(false)}
      >
        <span>
          {en ? item.en : item.ja}
          {en && japaneseOnly && <small className="site-link-language">JA</small>}
        </span>
        {index && <span aria-hidden="true">↗</span>}
      </a>
    );
  };

  return (
    <header
      ref={headerRef}
      className="site-header sticky top-0 z-50 bg-background/95 backdrop-blur-md"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
          setIsMenuOpen(false);
      }}
    >
      {isReading && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5" aria-hidden="true">
          <div
            ref={progressBarRef}
            className="reading-progress h-full origin-left"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      )}
      <div className="site-header-inner site-container">
        <a
          href={toLocalePath("/", locale)}
          className="site-wordmark"
          aria-label={`${SITE_TITLE} — ${en ? "Home" : "ホーム"}`}
        >
          <svg
            className="brand-mark"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="12" cy="5" r="2" />
            <circle cx="5" cy="18" r="2" />
            <circle cx="19" cy="18" r="2" />
          </svg>
          <span className="site-wordmark-title" lang="la">
            {SITE_TITLE}
          </span>
        </a>
        <nav
          aria-label={en ? "Main navigation" : "メインナビゲーション"}
          className="site-primary-nav"
        >
          {primaryItems.map((item) => navLink(item))}
          {navLink({ href: "/about", ja: "About", en: "About" })}
        </nav>
        <div className="site-header-actions">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-11 rounded-sm"
            aria-label={en ? "Search" : "検索"}
            title={en ? "Search" : "検索"}
          >
            <a
              href={toLocalePath("/search", locale)}
              aria-current={isActive("/search") ? "page" : undefined}
            >
              <Icon icon="lucide:search" className="size-4" aria-hidden="true" />
            </a>
          </Button>
          <div className="hidden items-center lg:flex">
            <LanguageToggle locale={locale} path={path} />
            <ThemeToggle />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            className="site-menu-toggle"
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
            <span className="site-menu-label">{en ? "Index" : "目次"}</span>
            <span className="site-menu-icon" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
      <div
        id="mobile-nav"
        inert={!isMenuOpen}
        className={cn(
          "site-mobile-nav grid",
          isMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="site-index-scroll">
            <div className="site-container site-index-inner">
              <nav className="site-index-grid" aria-label={en ? "Site index" : "サイトの目次"}>
                {navigationGroups.map((group) => (
                  <div key={group.en} className="site-index-group">
                    <p className="site-index-heading">{en ? group.en : group.ja}</p>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.href}>{navLink(item, true)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
              <div className="site-index-settings lg:hidden">
                <div>
                  <span>{en ? "Appearance" : "表示テーマ"}</span>
                  <ThemeToggle />
                </div>
                <div>
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
