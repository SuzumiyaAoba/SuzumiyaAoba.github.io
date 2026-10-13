"use client";

import { useTheme } from "next-themes";
import type { Locale } from "@/shared/lib/routing";
import { useMounted } from "@/shared/ui/use-mounted";

const LABELS = {
  ja: {
    light: "明",
    dark: "暗",
    toLight: "明るい表示にする",
    toDark: "暗い表示にする",
  },
  en: {
    light: "Light",
    dark: "Dark",
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },
} as const;

/**
 * 明暗の切り替え。アイコンではなく「明｜暗」の二文字を並べ、いまの側を墨で、もう一方を淡く刷る。
 * 押すたびに反対側へ切り替わる。
 */
export function ThemeToggle({ locale = "ja" }: { locale?: Locale }) {
  const mounted = useMounted();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const labels = LABELS[locale];
  // 描画前はどちらが選ばれているか分からないため、両方を淡く表示する。
  const isDark = mounted && resolvedTheme === "dark";
  const state = mounted ? (isDark ? "dark" : "light") : "unknown";

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  const label = isDark ? labels.toLight : labels.toDark;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      data-state={state}
      aria-label={label}
      title={label}
    >
      <span data-side="light">{labels.light}</span>
      <span className="theme-toggle-divider" aria-hidden="true" />
      <span data-side="dark">{labels.dark}</span>
    </button>
  );
}
