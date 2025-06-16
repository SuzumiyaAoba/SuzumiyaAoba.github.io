"use client";

import Image from "next/image";
import {
  StaticImageData,
  StaticRequire,
} from "next/dist/shared/lib/get-img-props";
import { DetailedHTMLProps, FC, ImgHTMLAttributes } from "react";
import { usePathname } from "next/navigation";

type SsgImageProps = Omit<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
  "src"
> & {
  src: string | StaticRequire | StaticImageData;
};

export const SsgImage: FC<SsgImageProps> = (props) => {
  const { src, alt, width, height, style, ...rest } = props;
  const pathname = usePathname();

  // 相対パスの場合、現在のページパスに基づいて絶対パスに変換する
  let resolvedSrc = src;
  if (typeof src === 'string' && (src.startsWith('./') || src.startsWith('../')) && pathname) {
    const pathParts = pathname.split('/').filter(Boolean);
    
    if (pathParts.length >= 3 && pathParts[0] === 'blog' && pathParts[1] === 'post') {
      // ブログ投稿の場合: /blog/post/slug/ → /assets/blog/slug/
      const postSlug = pathParts[2];
      const assetBase = `/assets/blog/${postSlug}`;
      
      if (src.startsWith('./')) {
        resolvedSrc = src.replace('./', `${assetBase}/`);
      } else if (src.startsWith('../')) {
        resolvedSrc = src.replace('../', `${assetBase}/`);
      }
    } else if (pathParts[0] === 'notes') {
      // notesの場合: /notes/programming/scala/cats/ → /assets/notes/programming/scala/cats/
      const notePath = pathParts.slice(1).join('/'); // "notes"を除いた残りの部分
      const assetBase = `/assets/notes/${notePath}`;
      
      if (src.startsWith('./')) {
        resolvedSrc = src.replace('./', `${assetBase}/`);
      } else if (src.startsWith('../')) {
        resolvedSrc = src.replace('../', `${assetBase}/`);
      }
    } else {
      // フォールバック: 単純に先頭の . を除去
      if (src.startsWith('./')) {
        resolvedSrc = src.replace('./', '/');
      } else if (src.startsWith('../')) {
        resolvedSrc = src.replace('../', '/');
      }
    }
  }

  // 全てのケースでNext.js Imageコンポーネントを使用
  return (
    <Image
      src={resolvedSrc}
      alt={alt ?? ""}
      width={(width as number) || 800}
      height={(height as number) || 600}
      style={{
        objectFit: "contain",
        position: "relative",
        maxWidth: "100%",
        ...style,
      }}
      {...rest}
    />
  );
};
