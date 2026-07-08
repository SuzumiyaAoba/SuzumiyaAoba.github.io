"use client";

import { useEffect, useState } from "react";
import type { HighlightedCode } from "codehike/code";

import { parseCodeMeta } from "@/shared/lib/mdx/code-meta";
import { cn } from "@/shared/lib/utils";
import { CustomCodeBlock } from "@/shared/ui/mdx/custom-code-block";
import { FootnoteNumber } from "@/shared/ui/mdx/codehike-handlers";

type CodeProps = {
  codeblock: HighlightedCode;
};

/**
 * シンタックスハイライト済みコードブロックは Code Hike が大量のトークン span を
 * 出力するため、ブログ記事のように 1 ページに数十個入る場合は初期 DOM が肥大して
 * ブラウザのレンダラープロセスを OOM させることがある。SSR 側ではプレースホルダー
 * のみを返し、クライアントマウント後に本体を描画して初期 DOM を軽量に保つ。
 */
export function Code({ codeblock }: CodeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const notes = codeblock.annotations
    .filter(({ name }) => name === "ref")
    .map(({ query }) => query);

  let noteIndex = 0;
  const annotations = codeblock.annotations.map((annotation) => {
    if (annotation.name !== "ref") {
      return annotation;
    }
    noteIndex += 1;
    return {
      ...annotation,
      data: { ...annotation.data, n: noteIndex },
    };
  });
  const { displayMeta } = parseCodeMeta(codeblock.meta);

  const normalizedCodeblock: HighlightedCode = {
    ...codeblock,
    annotations,
  };

  const lineCount = codeblock.code ? codeblock.code.split("\n").length : 1;
  const placeholderHeight = Math.min(Math.max(lineCount, 1), 24) * 1.5;

  return (
    <div className="my-6">
      {displayMeta ? (
        <div className="flex items-center justify-between rounded-t-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          <span className="truncate">{displayMeta}</span>
          <span className="text-[10px] uppercase tracking-[0.12em]">{codeblock.lang}</span>
        </div>
      ) : null}
      {mounted ? (
        <CustomCodeBlock
          code={normalizedCodeblock}
          {...(displayMeta ? { className: "rounded-t-none mt-0" } : {})}
        />
      ) : (
        <div
          aria-hidden
          className={cn(
            "my-4 rounded-lg bg-muted",
            displayMeta ? "rounded-t-none mt-0" : undefined,
          )}
          style={{ height: `${placeholderHeight}rem` }}
        />
      )}
      {notes.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {notes.map((note, index) => (
            <li key={`${note}-${index}`} className="flex items-start gap-2">
              <FootnoteNumber n={index + 1} />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
