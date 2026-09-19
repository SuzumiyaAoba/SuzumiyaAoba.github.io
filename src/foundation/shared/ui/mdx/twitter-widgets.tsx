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
      'script[src="https://platform.twitter.com/widgets.js"]'
    );

    if (existingScript) {
      if (window.twttr) {
        loadWidgets();
        return;
      }
      existingScript.addEventListener("load", loadWidgets, { once: true });
      return () => existingScript.removeEventListener("load", loadWidgets);
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.addEventListener("load", loadWidgets);
    document.body.append(script);
    return () => script.removeEventListener("load", loadWidgets);
  }, []);

  return null;
}
