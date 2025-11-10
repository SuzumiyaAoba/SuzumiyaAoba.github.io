"use client";

import { highlight, RawCode, HighlightedCode } from "codehike/code";
import type { Block } from "codehike/blocks";
import { CustomCodeBlock } from "./custom-code-block";
import { LanguageIcon } from "./language-icon";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Number } from "./footnote";
import { tooltip } from "./tooltip";

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

  const noteAnnotations = highlighted.annotations.filter(
    ({ name }) => name == "ref",
  );
  const notes = noteAnnotations.map(({ query }) => query);

  noteAnnotations.forEach((a, index) => {
    a.data = { n: index + 1 };
  });

  return (
    <div className="relative my-4">
      {highlighted.meta ? (
        <div
          className="flex rounded-t text-center border-b py-1"
          style={{
            backgroundColor: "var(--code-bg)",
            color: "var(--muted)",
          }}
        >
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
      <ul className="mt-4 !list-none">
        {notes.map((ref, index) => (
          <li key={index} className="text-sm">
            <Number n={index + 1} />
            <span className="pl-1">{ref}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
