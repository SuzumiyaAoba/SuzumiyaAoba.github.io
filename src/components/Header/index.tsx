"use client";

import { useState, useEffect, type FC, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { exo_2 } from "@/fonts";

// メニュー項目を定数として定義
const MENUS = [
  { name: "Blog", href: "/blog/" },
  { name: "Notes", href: "/notes/" },
  { name: "Tools", href: "/tools/" },
  { name: "Keywords", href: "/keywords/" },
] as const;

// ヘッダーの高さを定数として定義（外部からも参照できるように）
export const HEADER_HEIGHT = {
  scrolled: 60,
  default: 72,
};

type HeaderProps = {
  siteName: string;
};

export const Header: FC<HeaderProps> = ({ siteName }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ボディのスクロールをロック（メニュー開放時）
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 画面外クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isMobileMenuOpen) return;

      // メニュー自体か、メニューボタンがクリックされた場合は何もしない
      if (
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
    // スクロール状態のみに基づいてheader-heightを設定
    // モバイルメニューの開閉状態は反映しない
    const headerHeight = isScrolled
      ? `${HEADER_HEIGHT.scrolled}px`
      : `${HEADER_HEIGHT.default}px`;

    document.documentElement.style.setProperty("--header-height", headerHeight);
  }, [isScrolled]);

  // メニューの開閉を切り替える
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // イベントの伝播を停止
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header
        className={clsx(
          "fixed left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "top-4 w-[95%] max-w-4xl mx-auto rounded-xl shadow-lg bg-white/95 backdrop-blur-sm py-2"
            : "top-0 w-full bg-white py-4"
        )}
      >
        <div
          className={clsx(
            "flex items-center justify-between",
            isScrolled ? "px-6 mx-auto" : "max-w-4xl px-4 mx-auto"
          )}
        >
          <SiteLogo siteName={siteName} />

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:block">
            <DesktopNavigation menus={MENUS} />
          </nav>

          {/* ハンバーガーメニューボタン */}
          <button
            ref={buttonRef}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 relative z-50 focus:outline-none"
            onClick={toggleMenu}
            aria-label={
              isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"
            }
            aria-expanded={isMobileMenuOpen}
          >
            <HamburgerIcon isOpen={isMobileMenuOpen} />
          </button>
        </div>

        {/* スマホ向けナビゲーション（折りたたみ式） */}
        <div
          ref={menuRef}
          role="navigation"
          className={clsx(
            "md:hidden bg-white overflow-hidden transition-all duration-300 absolute w-full",
            isScrolled && "rounded-b-xl",
            isMobileMenuOpen
              ? "max-h-[300px] opacity-100 shadow-inner visible"
              : "max-h-0 opacity-0 invisible"
          )}
        >
          <div className="py-2">
            <MobileNavigation
              menus={MENUS}
              onNavigate={() => setIsMobileMenuOpen(false)}
              isVisible={isMobileMenuOpen}
            />
          </div>
        </div>
      </header>

      {/* フルスクリーンオーバーレイ */}
      <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

// ハンバーガーアイコンコンポーネント
const HamburgerIcon: FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <>
      <span
        className={clsx(
          "block absolute h-0.5 w-6 bg-neutral-800 transform transition-all duration-300 ease-in-out",
          isOpen ? "rotate-45 translate-y-0" : "-translate-y-2"
        )}
      />
      <span
        className={clsx(
          "block absolute h-0.5 w-6 bg-neutral-800 transform transition-all duration-300 ease-in-out",
          isOpen ? "opacity-0" : "opacity-100"
        )}
      />
      <span
        className={clsx(
          "block absolute h-0.5 w-6 bg-neutral-800 transform transition-all duration-300 ease-in-out",
          isOpen ? "-rotate-45 translate-y-0" : "translate-y-2"
        )}
      />
    </>
  );
};

type SiteLogoProps = {
  siteName: string;
};

const SiteLogo: FC<SiteLogoProps> = ({ siteName }) => (
  <Link
    href={"/"}
    className={clsx("text-2xl font-bold relative group", exo_2.className)}
  >
    <span className="text-neutral-900">{siteName}</span>
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neutral-800 transition-all duration-300 group-hover:w-full"></span>
  </Link>
);

type NavigationProps = {
  menus: readonly { name: string; href: string }[];
};

const DesktopNavigation: FC<NavigationProps> = ({ menus }) => (
  <ul className="flex gap-8">
    {menus.map((menu) => (
      <li key={menu.href}>
        <Link
          href={menu.href}
          className="px-2 py-1 relative text-neutral-700 hover:text-neutral-900 transition-colors duration-300 group"
        >
          {menu.name}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-neutral-800 transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </li>
    ))}
  </ul>
);

type MobileNavigationProps = NavigationProps & {
  onNavigate: () => void;
  isVisible: boolean;
};

const MobileNavigation: FC<MobileNavigationProps> = ({
  menus,
  onNavigate,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <ul className="py-4 px-6 space-y-3">
      {menus.map((menu, index) => (
        <li
          key={menu.href}
          className="menu-item-appear"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <Link
            href={menu.href}
            className="block py-2 px-3 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
          >
            {menu.name}
          </Link>
        </li>
      ))}
    </ul>
  );
};
