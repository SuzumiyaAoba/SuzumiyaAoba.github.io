"use client";

import { useState, useEffect, type FC, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { exo_2 } from "@/fonts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useHeaderVisibility } from "./useHeaderVisibility";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/libs/i18n/client";
import { MENUS } from "./menu";
import { SiteLogo } from "./SiteLogo";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
import { HamburgerIcon } from "./HamburgerIcon";

// ヘッダーの高さを定数として定義（外部からも参照できるように）
export const HEADER_HEIGHT = {
  scrolled: 60,
  default: 72,
};

const MOBILE_MENU_MAX_HEIGHT = "450px"; // モバイルメニューの最大高さ

type HeaderProps = {
  siteName: string;
};

/**
 * サイト全体のヘッダーコンポーネント
 *
 * スクロールに応じた表示/非表示の切り替え、モバイルメニューの制御、
 * およびナビゲーションリンクの表示を担当します。
 *
 * @param {HeaderProps} props - コンポーネントのプロパティ
 * @param {string} props.siteName - ヘッダーに表示するサイト名
 */
export const Header: FC<HeaderProps> = ({ siteName }) => {
  const { isScrolled, isVisible } = useHeaderVisibility();
  const { language } = useLanguage();
  const { t } = useTranslation(language, "common");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ボディのスクロールをロック（メニュー開放時）
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // 画面外クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !isMobileMenuOpen ||
        (menuRef.current && menuRef.current.contains(e.target as Node)) ||
        (buttonRef.current && buttonRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setIsMobileMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // ヘッダー高さを取得とCSS変数の設定
  useEffect(() => {
    const headerHeight = isScrolled
      ? `${HEADER_HEIGHT.scrolled}px`
      : `${HEADER_HEIGHT.default}px`;
    document.documentElement.style.setProperty("--header-height", headerHeight);
  }, [isScrolled]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <div
        className={clsx(
          "fixed left-0 right-0 z-50 transition-transform duration-300",
          !isVisible && "translate-y-[-100%]"
        )}
      >
        <header
          className={clsx(
            "w-full transition-all duration-300",
            isScrolled
              ? "top-4 w-[90%] max-w-4xl mx-auto rounded-xl shadow-lg bg-transparent py-2 backdrop-blur-md border border-opacity-40 border-white/25"
              : "w-full bg-transparent py-4"
          )}
          style={{
            transform: `translateY(${
              isVisible && isScrolled ? "16px" : "0"
            })`,
            opacity: isVisible ? 1 : 0,
            transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
            backgroundColor: isScrolled
              ? "var(--header-scrolled-bg)"
              : "var(--header-bg)",
            boxShadow: isScrolled
              ? "0 10px 25px -5px rgba(15, 23, 42, 0.15)"
              : "none",
          }}
        >
          <div
            className={clsx(
              "flex items-center justify-between",
              isScrolled ? "px-4 sm:px-6 mx-auto" : "max-w-4xl px-4 mx-auto"
            )}
          >
            <SiteLogo siteName={siteName} />

            <nav className="hidden md:block">
              <DesktopNavigation />
            </nav>

            {/* デスクトップ専用のテーマ切替ボタンと言語切替ボタンを右端に配置 */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            <button
              ref={buttonRef}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 relative z-50 focus:outline-none"
              onClick={toggleMenu}
              aria-label={isMobileMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
              aria-expanded={isMobileMenuOpen}
            >
              <HamburgerIcon isOpen={isMobileMenuOpen} />
            </button>
          </div>
          
          <div
            ref={menuRef}
            role="navigation"
            className={clsx(
              "md:hidden overflow-y-auto transition-all duration-300 absolute w-full left-0 right-0",
              isScrolled && "rounded-b-xl",
              isMobileMenuOpen
                ? "opacity-100 shadow-inner visible"
                : "max-h-0 opacity-0 invisible"
            )}
            style={{
              maxHeight: isMobileMenuOpen ? MOBILE_MENU_MAX_HEIGHT : "0px",
              zIndex: 40,
              backgroundColor: "var(--background-secondary)",
            }}
          >
            <div className="py-2">
              <MobileNavigation
                onNavigate={() => setIsMobileMenuOpen(false)}
                isVisible={isMobileMenuOpen}
              />
            </div>
            <div className="flex justify-center items-center gap-4 my-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>
      </div>
      <div
        style={{ height: isScrolled ? HEADER_HEIGHT.scrolled : HEADER_HEIGHT.default }}
      />
    </>
  );
};
