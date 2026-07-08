"use client";

import { Icon } from "@iconify/react";
import { Button } from "@/shared/ui/button";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

/**
 * LanguageToggle コンポーネントのプロップス
 */
type LanguageToggleProps = {
  /** 現在のロケール */
  locale: Locale;
  /** 切り替え後の遷移先ベースパス */
  path: string;
};

/**
 * サイトの表示言語を切り替えるコンポーネント
 * テーマ切り替えと同様に、アイコンボタンのトグルとして表示する
 * @param props ロケールと遷移パス
 */
export function LanguageToggle({ locale, path }: LanguageToggleProps) {
  const targetLocale: Locale = locale === "ja" ? "en" : "ja";
  const targetPath = toLocalePath(path, targetLocale);
  const label = targetLocale === "en" ? "Switch to English" : "日本語に切り替え";

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full"
      aria-label={label}
      title={label}
    >
      <a href={targetPath}>
        <Icon icon="lucide:languages" className="h-4 w-4" aria-hidden="true" />
      </a>
    </Button>
  );
}
