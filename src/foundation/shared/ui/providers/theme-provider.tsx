"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import type { ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

function SynchronizeTheme() {
  const { setTheme } = useTheme();
  useEffect(() => {
    const synchronize = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }
      const nextTheme: unknown = event.detail;
      if (nextTheme === "light" || nextTheme === "dark") {
        setTheme(nextTheme);
      }
    };
    window.addEventListener("site:theme", synchronize);
    return () => window.removeEventListener("site:theme", synchronize);
  }, [setTheme]);
  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <SynchronizeTheme />
      {children}
    </NextThemesProvider>
  );
}
