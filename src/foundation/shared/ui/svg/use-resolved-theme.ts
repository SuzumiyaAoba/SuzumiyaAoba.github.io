import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const getCurrentTheme = (): Theme => {
  if (typeof document === "undefined") {
    return "light";
  }
  const isDarkClass = document.documentElement.classList.contains("dark");
  if (isDarkClass) {
    return "dark";
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

export function useResolvedTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const updateTheme = () => setTheme(getCurrentTheme());

    updateTheme();

    const media =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    const observer = typeof document !== "undefined" ? new MutationObserver(updateTheme) : null;

    media?.addEventListener?.("change", updateTheme);
    observer?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      media?.removeEventListener?.("change", updateTheme);
      observer?.disconnect();
    };
  }, []);

  return theme;
}
