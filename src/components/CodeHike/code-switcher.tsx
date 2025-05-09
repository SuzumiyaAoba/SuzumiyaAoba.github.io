"use client";

import { highlight, RawCode, HighlightedCode } from "codehike/code";
import { LanguageSwitcher } from "./language-switcher";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function CodeSwitcher(props: { code: RawCode[] }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "github-dark" : "github-light";
  const [highlighted, setHighlighted] = useState<HighlightedCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHighlighted = async () => {
      try {
        const result = await Promise.all(
          props.code.map((codeblock) => highlight(codeblock, theme))
        );
        setHighlighted(result);
      } catch (error) {
        console.error("Error highlighting code:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlighted();
  }, [props.code, theme]);

  if (loading || highlighted.length === 0) {
    return <div className="p-4">Loading code...</div>;
  }

  return <LanguageSwitcher highlighted={highlighted} />;
}
