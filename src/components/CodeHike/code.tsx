"use client";

import { highlight, RawCode, HighlightedCode } from "codehike/code";
import { CustomCodeBlock } from "./custom-code-block";
import { LanguageIcon } from "./language-icon";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function Code({ codeblock }: { codeblock: RawCode }) {
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
        console.error("Error highlighting code:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlighted();
  }, [codeblock, theme]);

  if (loading || !highlighted) {
    return <div className="p-4">Loading code...</div>;
  }

  return (
    <div className="relative my-4">
      {highlighted.meta ? (
        <div className="flex rounded-t bg-slate-100 dark:bg-slate-800 text-center text-slate-500 dark:text-slate-400 border-b py-1">
          <div className="flex items-center pl-2 mx-auto">
            <LanguageIcon lang={highlighted.lang} className="mr-1" />
            {highlighted.meta}
          </div>
        </div>
      ) : (
        <></>
      )}
      <CustomCodeBlock
        code={highlighted}
        className={highlighted.meta ? "!rounded-none !rounded-b" : ""}
      />
    </div>
  );
}
