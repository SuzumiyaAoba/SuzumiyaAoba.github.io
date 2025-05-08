"use client";

import { useState, useEffect, type FC, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { exo_2 } from "@/fonts";
import { ThemeToggle } from "@/components/ThemeToggle";

// メニュー項目を定数として定義
const MENUS = [
  { name: "Blog", href: "/blog/" },
  { name: "Tags", href: "/tags/" },
  { name: "Notes", href: "/notes/" },
  { name: "Tools", href: "/tools/" },
  { name: "Keywords", href: "/keywords/" },
  { name: "Search", href: "/search/" },
] as const;

// ヘッダーの高さを定数として定義（外部からも参照できるように）
export const HEADER_HEIGHT = {
  scrolled: 60,
  default: 72,
};

// スクロール関連の定数
const SCROLL_THRESHOLD = 10; // 最上部判定のためのスクロール閾値(px)
const MOBILE_MENU_MAX_HEIGHT = "450px"; // モバイルメニューの最大高さ

type HeaderProps = {
  siteName: string;
};

export const Header: FC<HeaderProps> = ({ siteName }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isManuallyHidden, setIsManuallyHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastScrollYRef = useRef(0);
  const isAtTopRef = useRef(true);

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

  // スクロール位置に基づく表示状態の更新関数
  interface UpdateVisibilityStateProps {
    currentScrollY: number;
  }

  const updateVisibilityState = ({
    currentScrollY,
  }: UpdateVisibilityStateProps) => {
    // 最上部にいるかどうかの判定（閾値: 10px）
    const isAtTop = currentScrollY <= SCROLL_THRESHOLD;
    const wasAtTop = isAtTopRef.current;
    isAtTopRef.current = isAtTop;

    // トップに達したかどうかでスクロール状態を判定
    // トップからの離脱または到達時のみ状態を変更
    if (wasAtTop !== isAtTop) {
      setIsScrolled(!isAtTop);
    }

    return { isAtTop, wasAtTop };
  };

  // スクロール方向に基づくヘッダー表示の更新関数
  interface UpdateHeaderBasedOnScrollDirectionProps {
    currentScrollY: number;
  }

  const updateHeaderBasedOnScrollDirection = ({
    currentScrollY,
  }: UpdateHeaderBasedOnScrollDirectionProps) => {
    if (isManuallyHidden) return;

    // スクロールが最小値以上の場合のみ方向に基づいて処理
    if (currentScrollY > SCROLL_THRESHOLD) {
      // 上方向のスクロール（前回より小さい値）でヘッダーを表示
      if (currentScrollY < lastScrollYRef.current) {
        setIsVisible(true);
      }
      // 下方向のスクロール（前回より大きい値）でヘッダーを非表示
      else if (currentScrollY > lastScrollYRef.current) {
        setIsVisible(false);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 表示状態の更新
      const { isAtTop } = updateVisibilityState({ currentScrollY });

      // 手動で非表示にされていない場合のみ、スクロール方向に基づいて更新
      updateHeaderBasedOnScrollDirection({ currentScrollY });

      // 現在のスクロール位置を保存
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isManuallyHidden]);

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

  // ヘッダーの表示/非表示を切り替える
  const toggleHeaderVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    setIsManuallyHidden(!newVisibility);
  };

  // 実際の表示状態を計算（最上部では常に表示）
  const shouldBeVisible = isVisible || isAtTopRef.current;

  // モバイルメニュー最大高さ
  const mobileMenuHeight = MOBILE_MENU_MAX_HEIGHT;

  return (
    <>
      {/* 
        外側のdivでヘッダー位置と表示/非表示のみを制御
        アニメーションは独立して行い、スタイル変更による突然の動きを防止
      */}
      <div
        className={clsx(
          "fixed left-0 right-0 z-50 transition-transform duration-300",
          !shouldBeVisible && "translate-y-[-100%]" // 表示すべきでない場合のみ上に完全に隠す
        )}
      >
        {/* 内側のheaderでスタイルを条件分岐 */}
        <header
          className={clsx(
            "w-full transition-all duration-300",
            isScrolled
              ? "top-4 w-[90%] max-w-4xl mx-auto rounded-xl shadow-lg bg-transparent py-2 backdrop-blur-md border border-opacity-40 border-white/25"
              : "w-full bg-transparent py-4"
          )}
          style={{
            // 表示時のアニメーション（下から上へ）- 最上部では常に適用しない
            transform: `translateY(${
              shouldBeVisible && !isAtTopRef.current ? "16px" : "0"
            })`,
            opacity: shouldBeVisible ? 1 : 0, // 表示すべき場合は不透明度1
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

            {/* デスクトップナビゲーション */}
            <nav className="hidden md:block">
              <DesktopNavigation menus={MENUS} />
            </nav>

            {/* ハンバーガーメニューボタン */}
            <button
              ref={buttonRef}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 relative z-50 focus:outline-none"
              onClick={toggleMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
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
              "md:hidden overflow-y-auto transition-all duration-300 absolute w-full left-0 right-0",
              isScrolled && "rounded-b-xl",
              isMobileMenuOpen
                ? "opacity-100 shadow-inner visible"
                : "max-h-0 opacity-0 invisible"
            )}
            style={{
              maxHeight: isMobileMenuOpen ? mobileMenuHeight : "0px",
              zIndex: 40,
              backgroundColor: "var(--background-secondary)",
            }}
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
      </div>

      {/* ヘッダー表示/非表示切り替えボタン */}
      <button
        onClick={toggleHeaderVisibility}
        className={clsx(
          "fixed right-4 bottom-4 z-50 p-3 rounded-full shadow-lg transition-all",
          "flex items-center justify-center"
        )}
        style={{
          backgroundColor: "var(--accent-primary)",
          color: "white",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
        }}
        aria-label={isVisible ? "ヘッダーを非表示" : "ヘッダーを表示"}
      >
        <span
          className={clsx(
            "block w-5 h-5 transition-transform duration-300",
            isVisible ? "rotate-180" : "rotate-0"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isVisible ? (
              // 下向き矢印（ヘッダーを隠す）
              <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </>
            ) : (
              // 上向き矢印（ヘッダーを表示）
              <>
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </>
            )}
          </svg>
        </span>
      </button>

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
          "block absolute h-0.5 w-6 transform transition-all duration-300 ease-in-out",
          isOpen ? "rotate-45 translate-y-0" : "-translate-y-2"
        )}
        style={{ backgroundColor: "var(--foreground)" }}
      />
      <span
        className={clsx(
          "block absolute h-0.5 w-6 transform transition-all duration-300 ease-in-out",
          isOpen ? "opacity-0" : "opacity-100"
        )}
        style={{ backgroundColor: "var(--foreground)" }}
      />
      <span
        className={clsx(
          "block absolute h-0.5 w-6 transform transition-all duration-300 ease-in-out",
          isOpen ? "-rotate-45 translate-y-0" : "translate-y-2"
        )}
        style={{ backgroundColor: "var(--foreground)" }}
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
    <span style={{ color: "var(--foreground)" }}>{siteName}</span>
    <span
      className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
      style={{ backgroundColor: "var(--accent-primary)" }}
    ></span>
  </Link>
);

type NavigationProps = {
  menus: readonly { name: string; href: string }[];
};

const DesktopNavigation: FC<NavigationProps> = ({ menus }) => (
  <ul className="flex gap-4 sm:gap-8 items-center">
    {menus.map((menu) => (
      <li key={menu.href}>
        <Link
          href={menu.href}
          className="px-1 sm:px-2 py-1 relative transition-colors duration-300 group text-sm sm:text-base nav-link"
          style={{ color: "var(--muted)" }}
        >
          {menu.name}
          <span
            className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
            style={{ backgroundColor: "var(--accent-primary)" }}
          ></span>
        </Link>
      </li>
    ))}
    <li className="flex items-center">
      <ThemeToggle className="ml-2" />
    </li>
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
    <ul className="py-4 px-4 space-y-2">
      {menus.map((menu, index) => (
        <li
          key={menu.href}
          className="menu-item-appear"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <Link
            href={menu.href}
            className="block py-3 px-4 rounded-md transition-colors w-full mobile-nav-link"
            style={{ color: "var(--muted)" }}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
          >
            {menu.name}
          </Link>
        </li>
      ))}
      <li
        className="menu-item-appear flex justify-between items-center py-3 px-4"
        style={{ animationDelay: `${menus.length * 80}ms` }}
      >
        <span style={{ color: "var(--muted)" }}>テーマ切替</span>
        <ThemeToggle />
      </li>
    </ul>
  );
};
