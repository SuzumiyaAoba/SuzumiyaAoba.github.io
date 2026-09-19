"use client";

import { useTheme } from "next-themes";
import { Icon } from "@/shared/ui/icon-client";
import { Button } from "@/shared/ui/button";
import { useMounted } from "@/shared/ui/use-mounted";

/**
 * ダークモードとライトモードを切り替えるコンポーネント
 */
export function ThemeToggle() {
  const mounted = useMounted();
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-11 rounded-lg"
        aria-label="テーマを切り替え"
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="size-11 rounded-lg"
      aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
    >
      {isDark ? (
        <Icon icon="lucide:sun" className="h-4 w-4" />
      ) : (
        <Icon icon="lucide:moon" className="h-4 w-4" />
      )}
    </Button>
  );
}
