"use client";

import { type FC } from "react";
import Link from "next/link";
import { MENUS } from "./menu";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * デスクトップ表示用のナビゲーションメニュー
 *
 * @param {NavigationProps} props - コンポーネントのプロパティ
 * @param {typeof MENUS} props.menus - 表示するメニュー項目の配列
 */
export const DesktopNavigation: FC = () => (
  <div className="flex items-center space-x-6">
    <ul className="flex items-center space-x-6">
      {MENUS.map((menu) => (
        <li key={menu.name}>
          <Link
            href={menu.href}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {menu.name}
          </Link>
        </li>
      ))}
    </ul>
    <ThemeToggle />
  </div>
); 