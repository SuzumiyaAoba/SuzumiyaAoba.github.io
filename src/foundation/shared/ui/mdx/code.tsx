"use client";

import { annotationData } from "./annotation-data";

import type { HighlightedCode } from "codehike/code";

import { parseCodeMeta } from "@/shared/lib/mdx/code-meta";
import { useMounted } from "@/shared/ui/use-mounted";
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
  const mounted = useMounted();

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
      data: { ...annotationData(annotation.data), n: noteIndex },
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
    <div className="code-frame">
      {displayMeta ? (
        <div className="code-bar">
          <span className="code-bar-title">{displayMeta}</span>
          <span className="code-bar-lang">{codeblock.lang}</span>
        </div>
      ) : null}
      {mounted ? (
        <CustomCodeBlock code={normalizedCodeblock} />
      ) : (
        <div
          aria-hidden
          className="code-block h-(--placeholder-h)"
          style={{ "--placeholder-h": `${placeholderHeight}rem` }}
        />
      )}
      {notes.length > 0 ? (
        <ul className="code-notes">
          {notes.map((note, index) => (
            // 脚注は静的コンテンツで並び替え・途中挿入が起きない。
            // react-doctor-disable-next-line no-array-index-as-key
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
