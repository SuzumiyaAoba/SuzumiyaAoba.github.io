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
    <div className="code-frame">
      <div className="code-bar">
        {labels.map((label, index) => (
          // 選択中タブが index 管理の静的リストで、並び替えは起きない。
          // react-doctor-disable-next-line no-array-index-as-key
          <button
            key={`${label}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            aria-pressed={index === active}
            className="code-tab"
          >
            {label}
          </button>
        ))}
        {activeCode?.lang ? (
          <span className="code-bar-lang">{activeCode.lang}</span>
        ) : null}
      </div>
      {activeCode ? (
        <CustomCodeBlock code={activeCode} />
      ) : (
        <div className="code-placeholder">
          {hasError ? "Unable to highlight code." : "Loading code..."}
        </div>
      )}
    </div>
  );
}
