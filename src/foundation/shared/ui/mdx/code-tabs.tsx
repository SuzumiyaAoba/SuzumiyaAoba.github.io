"use client";

import type { RawCode } from "codehike/code";
import { useMemo, useState } from "react";

import { useHighlightedCode } from "./use-highlighted-code";

import { parseCodeMeta } from "@/shared/lib/mdx/code-meta";
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
  const { blocks: highlighted, hasError } = useHighlightedCode(tabs);
  const [active, setActive] = useState(0);
  const labels = useMemo(
    () =>
      tabs.map(
        (tab) => parseCodeMeta(tab.meta).displayMeta || tab.lang || "tab"
      ),
    [tabs]
  );

  const activeCode = highlighted[active];

  return (
    <div className="my-6">
      <div className="flex flex-wrap items-center gap-2 rounded-t-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
        {labels.map((label, index) => (
          // 選択中タブが index 管理の静的リストで、並び替えは起きない。
          // react-doctor-disable-next-line no-array-index-as-key
          <button
            key={`${label}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            className={`rounded-full px-3 py-1 transition-colors ${
              index === active
                ? "bg-background text-foreground"
                : "hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        {activeCode?.lang ? (
          <span className="ml-auto text-[10px] tracking-[0.12em] uppercase">
            {activeCode.lang}
          </span>
        ) : null}
      </div>
      {activeCode ? (
        <CustomCodeBlock code={activeCode} className="mt-0 rounded-t-none" />
      ) : (
        <div className="rounded-b-lg bg-muted px-4 py-6 text-sm text-muted-foreground">
          {hasError ? "Unable to highlight code." : "Loading code..."}
        </div>
      )}
    </div>
  );
}
