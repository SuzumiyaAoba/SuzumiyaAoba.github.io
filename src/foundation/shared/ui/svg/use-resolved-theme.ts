import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * 現在のテーマを取得するフック
 * next-themesのuseThemeをラップして、解決済みのテーマを返す
 */
export function useResolvedTheme(): Theme {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return "light";
  }

  return resolvedTheme === "dark" ? "dark" : "light";
}
