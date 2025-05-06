import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

type SeoImageProps = Omit<ImageProps, "alt"> & {
  alt?: string;
  fallbackAlt?: string;
  fileName?: string;
};

/**
 * SEO対策のための画像コンポーネント
 * - alt属性が無い場合は、ファイル名やfallbackAltから自動的に生成
 * - 画像の遅延読み込みや最適化
 */
export function SeoImage({
  src,
  alt,
  fallbackAlt = "画像",
  fileName,
  ...props
}: SeoImageProps) {
  const [generatedAlt, setGeneratedAlt] = useState<string>(alt || "");

  useEffect(() => {
    // altが明示的に指定されていない場合は生成する
    if (!alt) {
      // srcからファイル名を取得
      let altFromSrc = "";
      if (typeof src === "string") {
        // パスからファイル名部分を抽出
        const match = src.match(/([^\/]+)(?=\.\w+$)/);
        if (match && match[0]) {
          altFromSrc = match[0]
            .replace(/[-_]/g, " ") // ハイフンやアンダースコアをスペースに置換
            .replace(/\b\w/g, (c) => c.toUpperCase()); // 単語の先頭を大文字に
        }
      }

      // 明示的にファイル名が指定されている場合はそれを使用
      if (fileName) {
        altFromSrc = fileName;
      }

      // 最終的なalt属性を設定
      setGeneratedAlt(altFromSrc || fallbackAlt);
    }
  }, [src, alt, fallbackAlt, fileName]);

  return <Image src={src} alt={generatedAlt} loading="lazy" {...props} />;
}
