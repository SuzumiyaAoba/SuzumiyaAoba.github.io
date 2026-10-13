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
      <div className="code-placeholder">
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
    <div className="code-frame">
      <div className="code-bar">
        <label htmlFor="code-switcher-select" className="code-bar-lang">
          Lang
        </label>
        <select
          id="code-switcher-select"
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
          className="code-select"
        >
          {languages.map((lang, index) => (
            // 選択値が index 管理の静的リストで、並び替えは起きない。
            // react-doctor-disable-next-line no-array-index-as-key
            <option key={`${lang}-${index}`} value={index}>
              {lang}
            </option>
          ))}
        </select>
        {displayMeta ? (
          <span className="code-bar-title code-bar-end">{displayMeta}</span>
        ) : null}
      </div>
      <CustomCodeBlock code={activeCode} />
    </div>
  );
}
