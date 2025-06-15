"use client";

import { type FC, useEffect } from "react";
import Link from "next/link";
import { MENUS } from "./menu";

type MobileNavigationProps = {
  menus: typeof MENUS;
  onNavigate: () => void;
  isVisible: boolean;
};

/**
 * モバイル表示用のナビゲーションメニュー（折りたたみ式）
 *
 * @param {MobileNavigationProps} props - コンポーネントのプロパティ
 * @param {typeof MENUS} props.menus - 表示するメニュー項目の配列
 * @param {() => void} props.onNavigate - ナビゲーション実行時に呼び出されるコールバック
 * @param {boolean} props.isVisible - メニューが表示されているかどうか
 */
export const MobileNavigation: FC<MobileNavigationProps> = ({
  menus,
  onNavigate,
  isVisible,
}) => {
  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !isVisible) return;

      const focusableElements = document.querySelectorAll<HTMLElement>(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isVisible]);

  return (
    <ul className="flex flex-col items-center space-y-4">
      {menus.map((menu) => (
        <li key={menu.name}>
          <Link
            href={menu.href}
            className="block py-2 text-lg font-semibold transition-colors hover:text-primary"
            onClick={onNavigate}
          >
            {menu.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}; 