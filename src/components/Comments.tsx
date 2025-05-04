"use client";

import { memo } from "react";
import Giscus from "@giscus/react";
import type { GiscusProps } from "@giscus/react";
import { cn } from "@/lib/utils";

// GiscusPropsから必要な型を抽出し拡張する
export interface CommentsProps
  extends Omit<
    GiscusProps,
    "id" | "host" | "strict" | "reactionsEnabled" | "emitMetadata" | "loading"
  > {
  /** コンテナクラス名 */
  className?: string;
}

export const Comments = memo(
  ({
    repo = "SuzumiyaAoba/comments",
    repoId = "R_kgDONaoFSA",
    category = "Announcements",
    categoryId = "DIC_kwDONaoFSM4ClCYN",
    mapping = "pathname",
    theme = "light",
    lang = "ja",
    className,
    inputPosition = "top",
    ...restProps
  }: CommentsProps) => {
    return (
      <div className={cn("my-8", className)}>
        <Giscus
          id="comments"
          repo={repo}
          repoId={repoId}
          category={category}
          categoryId={categoryId}
          mapping={mapping}
          strict="0"
          reactionsEnabled="1"
          emitMetadata="1"
          inputPosition={inputPosition}
          theme={theme}
          lang={lang}
          loading="lazy"
          {...restProps}
        />
      </div>
    );
  }
);

Comments.displayName = "Comments";
