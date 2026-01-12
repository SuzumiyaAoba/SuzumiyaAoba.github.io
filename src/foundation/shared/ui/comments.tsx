"use client";

import { useEffect, useRef } from "react";

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
  theme?: string;
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
  theme = "light",
  lang = "ja",
  loading = "lazy",
}: CommentsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
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
    script.setAttribute("data-theme", theme);
    script.setAttribute("data-lang", lang);
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
    theme,
    lang,
    loading,
  ]);

  return <div ref={containerRef} className={cn("mt-12", className)} />;
}
