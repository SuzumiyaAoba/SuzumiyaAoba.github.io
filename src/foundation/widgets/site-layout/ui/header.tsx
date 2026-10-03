"use client";

import { Icon } from "@/shared/ui/icon-client";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

import {
  getNavigationState,
  navigationGroups,
  primaryItems,
} from "../model/navigation";
import { BrandMark } from "./brand-mark";
import { NavigationLink } from "./navigation-link";
import { useHeaderMenu } from "./use-header-menu";
import { useReadingProgress } from "./use-reading-progress";

type HeaderProps = { locale: Locale; path: string };

export function Header({ locale, path }: HeaderProps) {
  const {
    headerRef,
    menuButtonRef,
    isMenuOpen,
    closeMenu,
    toggleMenu,
    handleBlur,
  } = useHeaderMenu();
  const { isReading, isActive } = getNavigationState(path);
  const progressBarRef = useReadingProgress(isReading);
  const en = locale === "en";
  const searchLabel = en ? "Search" : "検索";

  return (
    <header ref={headerRef} className="site-header" onBlur={handleBlur}>
      <a href="#main-content" className="site-skip-link">
        {en ? "Skip to content" : "本文へ移動"}
      </a>
      {isReading && (
        <div className="reading-progress-track" aria-hidden="true">
          <div ref={progressBarRef} className="reading-progress" />
        </div>
      )}
      <div className="site-header-inner site-container">
        <a
          href={toLocalePath("/", locale)}
          className="site-brand"
          aria-label={`${SITE_TITLE} — ${en ? "Home" : "ホーム"}`}
        >
          <BrandMark />
          <span className="site-brand-name" lang="la">
            {SITE_TITLE}
          </span>
        </a>
        <nav
          aria-label={en ? "Main navigation" : "メインナビゲーション"}
          className="site-nav"
        >
          <ul>
            {primaryItems.map((item) => (
              <li key={item.href}>
                <NavigationLink
                  item={item}
                  locale={locale}
                  active={isActive(item.href)}
                  onNavigate={closeMenu}
                />
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header-actions">
          <a
            href={toLocalePath("/search", locale)}
            className="site-search-link"
            aria-label={searchLabel}
            aria-current={isActive("/search") ? "page" : undefined}
            title={searchLabel}
          >
            <Icon icon="lucide:search" className="size-4" aria-hidden="true" />
            <span className="site-search-label">{searchLabel}</span>
          </a>
          <div className="site-header-toggles">
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
          "site-mobile-nav",
          isMenuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="site-index-scroll">
            <div className="site-container site-index-inner">
              <nav
                className="site-index-grid"
                aria-label={en ? "Site index" : "サイトの目次"}
              >
                {navigationGroups.map((group) => (
                  <div key={group.en}>
                    <p className="site-index-heading">
                      {en ? group.en : group.ja}
                    </p>
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
              <div className="site-index-settings">
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
