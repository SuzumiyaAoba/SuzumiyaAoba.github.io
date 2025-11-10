import { memo } from "react";
import Image from "next/image";
import { AdComponent, AdComponentProps } from "../../AdComponent";

export interface A8netAdProps extends Omit<AdComponentProps, "children"> {
  /** 広告のリンクURL */
  linkUrl: string;
  /** 広告の画像URL */
  imageUrl: string;
  /** 追跡用画像のURL */
  trackerUrl: string;
  /** 広告画像の幅 */
  width: number | string;
  /** 広告画像の高さ */
  height: number | string;
  /** 広告の代替テキスト */
  alt?: string;
}

/**
 * A8.net広告の共通コンポーネント
 */
export const A8netAdComponent = memo(
  ({
    linkUrl,
    imageUrl,
    trackerUrl,
    width,
    height,
    alt = "",
    className,
    displayOn,
    withContainer = true,
    description = "A8.net広告",
  }: A8netAdProps) => {
    return (
      <AdComponent
        className={className}
        displayOn={displayOn}
        withContainer={withContainer}
        description={description}
      >
        <a href={linkUrl} rel="nofollow" target="_blank">
          <Image
            width={typeof width === "string" ? parseInt(width, 10) : width}
            height={typeof height === "string" ? parseInt(height, 10) : height}
            style={{ border: "0" }}
            alt={alt}
            src={imageUrl}
            loading="lazy"
            unoptimized={imageUrl.startsWith("http")} // 外部URLの場合は最適化しない
          />
        </a>
        {/* トラッカー画像はimgのままでも警告は無視できる */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width="1"
          height="1"
          style={{ border: "0" }}
          src={trackerUrl}
          alt=""
          loading="lazy"
        />
      </AdComponent>
    );
  },
);

A8netAdComponent.displayName = "A8netAdComponent";
