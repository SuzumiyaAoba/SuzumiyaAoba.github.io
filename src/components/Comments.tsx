"use client";

import { memo } from "react";
import Giscus from "@giscus/react";
import type { GiscusProps } from "@giscus/react";
import { cn } from "@/lib/utils";

// GiscusPropsの必須プロパティをオプショナルにする
type OptionalGiscusProps = Partial<GiscusProps>;

// 必要なプロパティのみ抽出して拡張
export interface CommentsProps
  extends Omit<
    OptionalGiscusProps,
    "id" | "host" | "strict" | "reactionsEnabled" | "emitMetadata" | "loading"
  > {
  /** コンテナクラス名 */
  className?: string;
  /** リポジトリ名 */
  repo?: GiscusProps["repo"];
  /** リポジトリID */
  repoId?: string;
  /** マッピング方法 */
  mapping?: GiscusProps["mapping"];
}

export const Comments = memo(
  ({
    repo = "SuzumiyaAoba/comments",
    repoId = "R_kgDONaoFSA",
    category = "Announcements",
    categoryId = "DIC_kwDOOapTPc4Cp5td",
    mapping = "pathname",
    theme = "dark_dimmed",
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
