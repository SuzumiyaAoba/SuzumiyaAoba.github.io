"use client";

import { highlight, Inline, RawCode, HighlightedCode } from "codehike/code";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function InlineCode({ codeblock }: { codeblock: RawCode }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "github-dark" : "github-light";
  const [highlighted, setHighlighted] = useState<HighlightedCode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHighlighted = async () => {
      try {
        const result = await highlight(codeblock, theme);
        setHighlighted(result);
      } catch (error) {
        console.error("Error highlighting inline code:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlighted();
  }, [codeblock, theme]);

  if (loading || !highlighted) {
    return <span style={{ color: "var(--codehike-muted-text)" }}>...</span>;
  }

  return <Inline code={highlighted} style={highlighted.style} />;
}
