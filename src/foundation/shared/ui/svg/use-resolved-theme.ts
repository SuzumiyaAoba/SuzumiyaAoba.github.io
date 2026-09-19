import { useTheme } from "next-themes";
import { useMounted } from "@/shared/ui/use-mounted";

/**
 * 解決されたテーマの種類
 */
type Theme = "light" | "dark";

/**
 * 現在のテーマを取得するフック
 * next-themesのuseThemeをラップして、解決済みのテーマを返す
 */
export function useResolvedTheme(): Theme {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return "light";
  }

  return resolvedTheme === "dark" ? "dark" : "light";
}
