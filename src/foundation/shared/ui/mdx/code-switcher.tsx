"use client";

import type { RawCode } from "codehike/code";
import { useMemo, useState } from "react";

import { useHighlightedCode } from "./use-highlighted-code";

import { parseCodeMeta } from "@/shared/lib/mdx/code-meta";
import { CustomCodeBlock } from "@/shared/ui/mdx/custom-code-block";

export function CodeSwitcher({ code }: { code?: RawCode[] }) {
  if (!code || code.length === 0) {
    return null;
  }
  return <HighlightedCodeSwitcher code={code} />;
}

function HighlightedCodeSwitcher({ code }: { code: RawCode[] }) {
  const { blocks: highlighted, hasError } = useHighlightedCode(code);

  const languages = useMemo(
    () => highlighted.map((block) => block.lang || "text"),
    [highlighted]
  );
  const [selected, setSelected] = useState(0);

  if (highlighted.length === 0) {
    return (
      <div className="my-6 rounded-lg border border-border bg-muted px-4 py-6 text-sm text-muted-foreground">
        {hasError ? "Unable to highlight code." : "Loading code..."}
      </div>
    );
  }

  const activeCode = highlighted[selected] ?? highlighted[0];

  if (!activeCode) {
    return null;
  }
  const { displayMeta } = parseCodeMeta(activeCode.meta);

  return (
    <div className="my-6">
      <div className="flex items-center gap-3 rounded-t-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
        <label
          htmlFor="code-switcher-select"
          className="text-[10px] tracking-[0.12em] uppercase"
        >
          Lang
        </label>
        <select
          id="code-switcher-select"
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
        >
          {languages.map((lang, index) => (
            <option key={`${lang}-${index}`} value={index}>
              {lang}
            </option>
          ))}
        </select>
        {displayMeta ? (
          <span className="ml-auto truncate text-[10px] tracking-[0.12em] uppercase">
            {displayMeta}
          </span>
        ) : null}
      </div>
      <CustomCodeBlock code={activeCode} className="mt-0 rounded-t-none" />
    </div>
  );
}
