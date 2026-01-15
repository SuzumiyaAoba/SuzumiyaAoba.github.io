"use client";

import { highlight, type HighlightedCode, type RawCode } from "codehike/code";
import { useEffect, useMemo, useState } from "react";

import { CustomCodeBlock } from "@/shared/ui/mdx/custom-code-block";

export function CodeSwitcher({ code = [] }: { code?: RawCode[] }) {
  if (code.length === 0) {
    return null;
  }
  const [highlighted, setHighlighted] = useState<HighlightedCode[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await Promise.all(
        code.map((block) =>
          highlight(block, "github-from-css"),
        ),
      );
      if (!cancelled) {
        setHighlighted(result);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const languages = useMemo(() => highlighted.map((block) => block.lang || "text"), [highlighted]);
  const [selected, setSelected] = useState(0);

  if (highlighted.length === 0) {
    return (
      <div className="my-6 rounded-lg border border-border bg-muted px-4 py-6 text-sm text-muted-foreground">
        Loading code...
      </div>
    );
  }

  const activeCode = highlighted[selected] ?? highlighted[0];

  if (!activeCode) {
    return null;
  }

  return (
    <div className="my-6">
      <div className="flex items-center gap-3 rounded-t-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
        <label htmlFor="code-switcher-select" className="text-[10px] uppercase tracking-[0.12em]">
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
        {activeCode?.meta ? (
          <span className="ml-auto truncate text-[10px] uppercase tracking-[0.12em]">
            {activeCode.meta}
          </span>
        ) : null}
      </div>
      <CustomCodeBlock code={activeCode} className="rounded-t-none mt-0" />
    </div>
  );
}
