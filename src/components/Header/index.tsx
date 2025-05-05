"use client";

import { useState, useEffect, type FC } from "react";
import Link from "next/link";
import clsx from "clsx";
import { exo_2 } from "@/fonts";
import { Menu, X } from "lucide-react";

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
  mobile: {
    menuOpen: 280,
  },
};

type HeaderProps = {
  siteName: string;
};

export const Header: FC<HeaderProps> = ({ siteName }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ヘッダー高さを取得
  const headerHeight = isScrolled
    ? `${HEADER_HEIGHT.scrolled}px`
    : `${HEADER_HEIGHT.default}px`;

  // グローバルにCSS変数を設定
  useEffect(() => {
    document.documentElement.style.setProperty("--header-height", headerHeight);

    // モバイルナビゲーションが開いている場合は高さを調整
    if (isMobileMenuOpen && window.innerWidth < 768) {
      document.documentElement.style.setProperty(
        "--header-height",
        `${HEADER_HEIGHT.mobile.menuOpen}px`
      );
    }
  }, [isScrolled, isMobileMenuOpen, headerHeight]);

  return (
    <header
      className={clsx(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled ? "bg-white shadow-sm py-2" : "bg-white py-4"
      )}
    >
      <div className="flex max-w-4xl px-4 mx-auto items-center justify-between">
        <SiteLogo siteName={siteName} />

        {/* デスクトップナビゲーション */}
        <nav className="hidden md:block">
          <DesktopNavigation menus={MENUS} />
        </nav>

        {/* モバイルメニューボタン */}
        <button
          className="md:hidden text-neutral-700 hover:text-neutral-900 transition"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* モバイルナビゲーション */}
      <div
        className={clsx(
          "md:hidden bg-white w-full overflow-hidden transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "max-h-64 shadow-md" : "max-h-0"
        )}
      >
        <MobileNavigation
          menus={MENUS}
          onNavigate={() => setIsMobileMenuOpen(false)}
        />
      </div>
    </header>
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
};

const MobileNavigation: FC<MobileNavigationProps> = ({ menus, onNavigate }) => (
  <ul className="py-3 px-4 space-y-2">
    {menus.map((menu) => (
      <li key={menu.href}>
        <Link
          href={menu.href}
          className="block py-2 px-3 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-md transition-colors"
          onClick={onNavigate}
        >
          {menu.name}
        </Link>
      </li>
    ))}
  </ul>
);
