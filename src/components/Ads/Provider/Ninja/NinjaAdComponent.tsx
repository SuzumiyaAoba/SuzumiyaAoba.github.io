import { memo } from "react";
import Script from "next/script";
import { AdComponent, AdComponentProps } from "../../AdComponent";

export interface NinjaAdProps extends Omit<AdComponentProps, "children"> {
  /** 忍者Adsのアカウントと広告ID */
  adId: string;
  /** 広告のタイプ */
  adType?: "banner" | "rectangle";
  /** 広告表示エリアの幅 */
  width: number | string;
  /** 広告表示エリアの高さ */
  height: number | string;
}

/**
 * 忍者Ads用の共通コンポーネント
 */
export const NinjaAdComponent = memo(
  ({
    adId,
    adType = "banner",
    width,
    height,
    className,
    displayOn,
    withContainer = true,
    description = "忍者Ads広告",
  }: NinjaAdProps) => {
    const scriptId = `NinjaAds-${adId}`;

    return (
      <AdComponent
        className={className}
        displayOn={displayOn}
        withContainer={withContainer}
        description={description}
      >
        <div
          className="admax-ads"
          data-admax-id={adId}
          style={{ display: "inline-block", width, height }}
        />
        <Script id={scriptId} type="text/javascript">
          {`(admaxads = window.admaxads || []).push({admax_id: "${adId}", type: "${adType}"});`}
        </Script>
        <Script
          type="text/javascript"
          src="https://adm.shinobi.jp/st/t.js"
          async
          strategy="lazyOnload"
        />
      </AdComponent>
    );
  }
);

NinjaAdComponent.displayName = "NinjaAdComponent";
