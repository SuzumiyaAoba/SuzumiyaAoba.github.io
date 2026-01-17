"use client";

import { highlight, type HighlightedCode, type RawCode } from "codehike/code";
import { useEffect, useMemo, useState } from "react";

import { CustomCodeBlock } from "@/shared/ui/mdx/custom-code-block";

type CodeWithTabsProps = {
  tabs?: RawCode[];
};

export function CodeWithTabs(props: CodeWithTabsProps) {
  const tabs = props.tabs ?? [];
  if (tabs.length === 0) {
    return null;
  }

  return <CodeTabs tabs={tabs} />;
}

function CodeTabs({ tabs }: { tabs: RawCode[] }) {
  const [highlighted, setHighlighted] = useState<HighlightedCode[]>([]);
  const [active, setActive] = useState(0);
  const labels = useMemo(() => tabs.map((tab) => tab.meta || tab.lang || "tab"), [tabs]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await Promise.all(tabs.map((tab) => highlight(tab, "github-from-css")));
      if (!cancelled) {
        setHighlighted(result);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tabs]);

  const activeCode = highlighted[active];

  return (
    <div className="my-6">
      <div className="flex flex-wrap items-center gap-2 rounded-t-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
        {labels.map((label, index) => (
          <button
            key={`${label}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            className={`rounded-full px-3 py-1 transition-colors ${
              index === active ? "bg-background text-foreground" : "hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        {activeCode?.lang ? (
          <span className="ml-auto text-[10px] uppercase tracking-[0.12em]">{activeCode.lang}</span>
        ) : null}
      </div>
      {activeCode ? (
        <CustomCodeBlock code={activeCode} className="rounded-t-none mt-0" />
      ) : (
        <div className="rounded-b-lg bg-muted px-4 py-6 text-sm text-muted-foreground">
          Loading code...
        </div>
      )}
    </div>
  );
}
