"use client";

import { useEffect } from "react";

function isInternalPath(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function normalizePath(href: string, locale: "ja" | "en") {
  if (!isInternalPath(href)) {
    return href;
  }
  if (href.startsWith("/contents")) {
    return href;
  }
  if (locale === "en") {
    if (href === "/en" || href.startsWith("/en/")) {
      return href;
    }
    return href === "/" ? "/en" : `/en${href}`;
  }
  return href;
}

export function LocaleLinkRewriter() {
  useEffect(() => {
    const update = () => {
      const locale = document.documentElement.dataset["lang"] === "en" ? "en" : "ja";
      const anchors = document.querySelectorAll<HTMLAnchorElement>("a[href]");
      anchors.forEach((anchor) => {
        const href = anchor.getAttribute("href");
        if (!href) return;
        const normalized = normalizePath(href, locale);
        if (normalized !== href) {
          anchor.setAttribute("href", normalized);
        }
      });
    };

    update();
    document.addEventListener("languagechange", update);

    const observer = new MutationObserver(() => update());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("languagechange", update);
    };
  }, []);

  return null;
}
