"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load?: (target?: Element | Document) => void;
      };
    };
  }
}

/**
 * X(Twitter) 埋め込み用のウィジェットスクリプトをクライアントで読み込む
 */
export function TwitterWidgets() {
  useEffect(() => {
    const loadWidgets = () => {
      window.twttr?.widgets?.load?.(document);
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://platform.twitter.com/widgets.js"]',
    );

    if (existingScript) {
      if (window.twttr) {
        loadWidgets();
      } else {
        existingScript.addEventListener("load", loadWidgets, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = loadWidgets;
    document.body.appendChild(script);
  }, []);

  return null;
}
