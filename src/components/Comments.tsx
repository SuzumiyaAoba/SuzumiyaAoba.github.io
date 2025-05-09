"use client";

import { memo, useEffect, useState } from "react";
import Giscus from "@giscus/react";
import type { GiscusProps } from "@giscus/react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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

// Giscusテーマのマッピング
const giscusThemeMap = {
  light: "light",
  dark: "dark_dimmed",
};

// テーマ変更時のメッセージを送信する関数
function sendMessageToGiscus(message: { setConfig: { theme: string } }) {
  const iframe = document.querySelector(
    "iframe.giscus-frame"
  ) as HTMLIFrameElement;
  if (!iframe) return;
  iframe.contentWindow?.postMessage({ giscus: message }, "https://giscus.app");
}

export const Comments = ({
  repo = "SuzumiyaAoba/comments",
  repoId = "R_kgDOOapTPQ",
  category = "Announcements",
  categoryId = "DIC_kwDOOapTPc4Cp5td",
  mapping = "pathname",
  lang = "ja",
  className,
  inputPosition = "top",
  ...restProps
}: CommentsProps) => {
  // サイトのテーマを取得
  const { resolvedTheme } = useTheme();
  // 初期値はresolvedThemeから直接決定する
  const initialTheme = giscusThemeMap[resolvedTheme] || "dark_dimmed";
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  // テーマが変更されたらGiscusのテーマも変更する
  useEffect(() => {
    // resolvedThemeをGiscusのテーマに変換
    const giscusTheme = giscusThemeMap[resolvedTheme] || "dark_dimmed";
    setCurrentTheme(giscusTheme);

    // すでにiframeが存在する場合は、メッセージを送信して動的にテーマを変更
    sendMessageToGiscus({
      setConfig: {
        theme: `https://giscus.app/themes/${giscusTheme}.css`,
      },
    });
  }, [resolvedTheme]);

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
        theme={currentTheme}
        lang={lang}
        loading="lazy"
        {...restProps}
      />
    </div>
  );
};

Comments.displayName = "Comments";
