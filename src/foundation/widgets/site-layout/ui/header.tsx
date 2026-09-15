"use client";

import { Icon } from "@/shared/ui/icon-client";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

import { getNavigationState, navigationGroups, primaryItems } from "../model/navigation";
import { NavigationLink } from "./navigation-link";
import { useHeaderMenu } from "./use-header-menu";
import { useReadingProgress } from "./use-reading-progress";

type HeaderProps = { locale: Locale; path: string };

export function Header({ locale, path }: HeaderProps) {
  const { headerRef, menuButtonRef, isMenuOpen, closeMenu, toggleMenu, handleBlur } =
    useHeaderMenu();
  const { isReading, isActive } = getNavigationState(path);
  const progressBarRef = useReadingProgress(isReading);
  const en = locale === "en";

  return (
    <header
      ref={headerRef}
      className="site-header sticky top-0 z-50 bg-background/95 backdrop-blur-md"
      onBlur={handleBlur}
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
          {primaryItems.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              locale={locale}
              active={isActive(item.href)}
              onNavigate={closeMenu}
            />
          ))}
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
            onClick={toggleMenu}
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
                        <li key={item.href}>
                          <NavigationLink
                            item={item}
                            locale={locale}
                            active={isActive(item.href)}
                            index
                            onNavigate={closeMenu}
                          />
                        </li>
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
