"use client";

import { Icon } from "@/shared/ui/icon-client";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { SiteLockup } from "@/shared/ui/site-lockup";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

import {
  getNavigationState,
  navigationGroups,
  primaryItems,
} from "../model/navigation";
import { NavigationLink } from "./navigation-link";
import { useHeaderMenu } from "./use-header-menu";
import { useReadingProgress } from "./use-reading-progress";

type HeaderProps = { locale: Locale; path: string };

/**
 * サイトのヘッダー。本の柱（ランニングヘッド）のように、ページの頭に一度だけ置いてスクロールには追従させない。
 * 狭い画面ではナビゲーションを「目次」にまとめ、ボタンも記号ではなく言葉で示す。
 */
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
          <SiteLockup size="sm" />
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
            aria-current={isActive("/search") ? "page" : undefined}
          >
            <Icon
              icon="lucide:search"
              className="size-3.5"
              aria-hidden="true"
            />
            {searchLabel}
          </a>
          <div className="site-header-toggles">
            <LanguageToggle locale={locale} path={path} />
            <ThemeToggle locale={locale} />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            className="site-menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (en ? "Close" : "閉じる") : en ? "Contents" : "目次"}
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
                  <span>{en ? "Theme" : "表示"}</span>
                  <ThemeToggle locale={locale} />
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
