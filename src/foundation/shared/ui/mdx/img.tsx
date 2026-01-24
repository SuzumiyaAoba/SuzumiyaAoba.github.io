"use client";
import Image from "next/image";
import type { ImgHTMLAttributes } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import { cn } from "@/shared/lib/utils";

/**
 * MDX 内で使用される画像コンポーネントのプロパティ
 */
export type MdxImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** 画像のベースパス（相対パス解決用） */
  basePath?: string;
};

/**
 * 文字列または数値を数値に変換する
 * @param value 変換対象の値
 * @returns 変換後の数値。変換できない場合は undefined
 */
const toNumber = (value?: number | string): number | undefined => {
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return value;
};

/**
 * MDX 内で画像を表示するためのコンポーネント。
 * 次の機能を持ちます：
 * - Next.js の `next/image` を使用した描画
 * - `react-medium-image-zoom` による拡大表示機能
 * - `.png`, `.jpg`, `.jpeg` ファイルの `.webp` への自動変換（ベースパスが指定されている場合）
 */
export function Img({ basePath, src, width, height, className, ...props }: MdxImgProps) {
  const resolvedSrc =
    typeof src === "string"
      ? basePath && src.startsWith("./")
        ? `${basePath}/${src.replace(/^\.\//, "").replace(/\.(png|jpg|jpeg)$/i, ".webp")}`
        : src
      : "";
  const resolvedWidth = toNumber(width) ?? 1200;
  const resolvedHeight = toNumber(height) ?? 675;

  return (
    <span className="my-4 block">
      <Zoom>
        <Image
          src={resolvedSrc}
          alt={props.alt ?? ""}
          width={resolvedWidth}
          height={resolvedHeight}
          className={cn("mx-auto block", className)}
          unoptimized
        />
      </Zoom>
    </span>
  );
}
