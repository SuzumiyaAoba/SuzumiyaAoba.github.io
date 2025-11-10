"use client";

import Image from "next/image";
import {
  StaticImageData,
  StaticRequire,
} from "next/dist/shared/lib/get-img-props";
import { DetailedHTMLProps, FC, ImgHTMLAttributes, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type SsgImageProps = Omit<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
  "src"
> & {
  src: string | StaticRequire | StaticImageData;
  /** ベースパス（例: "/assets/blog/my-post"） */
  basePath?: string;
  /** カスタムパス解決関数 */
  resolveImagePath?: (src: string, basePath?: string) => string;
  /** 優先度 */
  priority?: boolean;
  /** 画像のサイズ */
  sizes?: string;
  /** 画質 */
  quality?: number;
  /** プレースホルダー */
  placeholder?: "blur" | "empty";
  /** ブラープレースホルダーデータURL */
  blurDataURL?: string;
  /** 最適化を無効にする（SSG環境で推奨） */
  unoptimized?: boolean;
  /** Next.js Image使用を強制的に無効化 */
  useNativeImg?: boolean;
  /** 画像のズーム機能を無効にする */
  disableZoom?: boolean;
};

/**
 * デフォルトのパス解決関数
 * 相対パスを絶対パスに変換する
 */
const defaultResolveImagePath = (src: string, basePath?: string): string => {
  if (typeof src !== "string") {
    return src as string;
  }

  // 既に絶対パスまたはURL の場合はそのまま返す
  if (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    return src;
  }

  // 相対パスの場合
  if (basePath) {
    if (src.startsWith("./")) {
      return `${basePath}/${src.replace("./", "")}`;
    } else if (src.startsWith("../")) {
      // 一階層上に移動する場合の簡易的な処理
      const pathParts = basePath.split("/").filter(Boolean);
      pathParts.pop(); // 最後の要素を削除
      return `/${pathParts.join("/")}/${src.replace("../", "")}`;
    } else {
      // "./", "../" がない相対パスの場合
      return `${basePath}/${src}`;
    }
  }

  // basePathがない場合は、ルートからの相対パスとして扱う
  if (src.startsWith("./")) {
    return src.replace("./", "/");
  } else if (src.startsWith("../")) {
    return src.replace("../", "/");
  }

  // デフォルトでルートパスを追加
  return `/${src}`;
};

export const SsgImage: FC<SsgImageProps> = (props) => {
  const {
    src,
    alt,
    width,
    height,
    style,
    basePath,
    resolveImagePath = defaultResolveImagePath,
    priority = false,
    sizes,
    quality,
    placeholder,
    blurDataURL,
    unoptimized = true, // SSG環境のためデフォルトで最適化を無効化
    useNativeImg = false,
    disableZoom = false,
    ...rest
  } = props;

  const [isOpen, setIsOpen] = useState(false);

  // パスを解決
  const resolvedSrc =
    typeof src === "string" ? resolveImagePath(src, basePath) : src;

  // 画像のクリックハンドラ
  const handleClick = () => {
    if (!disableZoom) {
      setIsOpen(true);
    }
  };

  // 画像コンポーネントを生成
  const imageElement = useNativeImg ? (
    <img
      src={resolvedSrc as string}
      alt={alt ?? ""}
      width={width}
      height={height}
      onClick={handleClick}
      style={{
        objectFit: "contain",
        position: "relative",
        maxWidth: "100%",
        height: "auto",
        cursor: disableZoom ? "default" : "zoom-in",
        ...style,
      }}
      {...rest}
    />
  ) : (
    <Image
      src={resolvedSrc}
      alt={alt ?? ""}
      width={(width as number) || 800}
      height={(height as number) || 600}
      priority={priority}
      sizes={sizes}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      unoptimized={unoptimized}
      onClick={handleClick}
      style={{
        objectFit: "contain",
        position: "relative",
        maxWidth: "100%",
        height: "auto",
        cursor: disableZoom ? "default" : "zoom-in",
        ...style,
      }}
      {...rest}
    />
  );

  return (
    <>
      {imageElement}
      {!disableZoom && (
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          slides={[
            {
              src: resolvedSrc as string,
              alt: alt ?? "",
              width: (width as number) || 1920,
              height: (height as number) || 1080,
            },
          ]}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            zoomInMultiplier: 2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            doubleClickMaxStops: 2,
            keyboardMoveDistance: 50,
            wheelZoomDistanceFactor: 100,
            pinchZoomDistanceFactor: 100,
            scrollToZoom: true,
          }}
          carousel={{
            finite: true,
          }}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
        />
      )}
    </>
  );
};
