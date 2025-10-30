"use client";

import { type FC } from "react";
import Link from "next/link";
import { MENUS } from "./menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/libs/i18n/client";

/**
 * デスクトップ表示用のナビゲーションメニュー
 */
export const DesktopNavigation: FC = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language, "common");

  return (
    <div className="flex items-center">
      <ul className="flex items-center space-x-6">
        {MENUS.map((menu) => (
          <li key={menu.name}>
            <Link
              href={menu.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t(menu.i18nKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}; 