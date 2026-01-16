"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";

const STORAGE_KEY = "site-lang";
type Language = "ja" | "en";

function resolveStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "ja";
  }
  const path = window.location.pathname;
  return path === "/en" || path.startsWith("/en/") ? "en" : "ja";
}

function applyLanguage(lang: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dataset["lang"] = lang;
  document.dispatchEvent(new CustomEvent("languagechange", { detail: lang }));
}

export function LanguageToggle() {
  const [lang, setLang] = useState<Language>("ja");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const resolved = resolveStoredLanguage();
    setLang(resolved);
    applyLanguage(resolved);
  }, []);

  const setLanguage = (next: Language) => {
    setLang(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyLanguage(next);
    if (!pathname) {
      return;
    }
    const isEnPath = pathname === "/en" || pathname.startsWith("/en/");
    if (next === "en" && !isEnPath) {
      const target = pathname === "/" ? "/en" : `/en${pathname}`;
      router.push(target);
    }
    if (next === "ja" && isEnPath) {
      const target = pathname === "/en" ? "/" : pathname.replace(/^\/en/, "");
      router.push(target);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={lang === "ja"}
        className={`rounded-none bg-transparent px-0 text-xs font-semibold uppercase tracking-[0.2em] ${
          lang === "ja" ? "text-foreground" : "text-muted-foreground"
        }`}
        onClick={() => setLanguage("ja")}
      >
        JA
      </Button>
      <span className="text-border/70">/</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={lang === "en"}
        className={`rounded-none bg-transparent px-0 text-xs font-semibold uppercase tracking-[0.2em] ${
          lang === "en" ? "text-foreground" : "text-muted-foreground"
        }`}
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
    </div>
  );
}
