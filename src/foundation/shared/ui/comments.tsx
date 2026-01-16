"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

type CommentsProps = {
  className?: string;
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
  mapping?: "pathname" | "url" | "title" | "og:title" | "specific";
  strict?: "0" | "1";
  reactionsEnabled?: "0" | "1";
  emitMetadata?: "0" | "1";
  inputPosition?: "top" | "bottom";
  lang?: string;
  loading?: "lazy" | "eager";
};

export function Comments({
  className,
  repo = "SuzumiyaAoba/comments",
  repoId = "R_kgDOOapTPQ",
  category = "Announcements",
  categoryId = "DIC_kwDOOapTPc4Cp5td",
  mapping = "pathname",
  strict = "0",
  reactionsEnabled = "1",
  emitMetadata = "1",
  inputPosition = "top",
  lang = "ja",
  loading = "lazy",
}: CommentsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeLang, setActiveLang] = useState(lang);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateLang = () => {
      const docLang = document.documentElement.dataset["lang"];
      if (docLang === "en" || docLang === "ja") {
        setActiveLang(docLang);
      } else {
        setActiveLang(lang);
      }
    };

    updateLang();
    document.addEventListener("languagechange", updateLang);
    return () => {
      document.removeEventListener("languagechange", updateLang);
    };
  }, [lang]);

  const giscusTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mounted) return;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", mapping);
    script.setAttribute("data-strict", strict);
    script.setAttribute("data-reactions-enabled", reactionsEnabled);
    script.setAttribute("data-emit-metadata", emitMetadata);
    script.setAttribute("data-input-position", inputPosition);
    script.setAttribute("data-theme", giscusTheme);
    script.setAttribute("data-lang", activeLang);
    script.setAttribute("data-loading", loading);
    container.appendChild(script);
  }, [
    repo,
    repoId,
    category,
    categoryId,
    mapping,
    strict,
    reactionsEnabled,
    emitMetadata,
    inputPosition,
    activeLang,
    loading,
    mounted,
    giscusTheme,
  ]);

  // テーマ変更時にGiscusにメッセージを送信
  useEffect(() => {
    if (!mounted) return;

    const iframe = document.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame"
    );
    if (iframe) {
      iframe.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: giscusTheme } } },
        "https://giscus.app"
      );
    }
  }, [giscusTheme, mounted]);

  return <div ref={containerRef} className={cn("mt-12", className)} />;
}
