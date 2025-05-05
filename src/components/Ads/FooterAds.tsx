import { memo } from "react";
import { DmmFx } from "./Provider/A8net/DmmFx";
import { NinjaFooterAds } from "./Provider/Ninja/NinjaFooterAds";
import { KiddyFirst } from "./Provider/Rakuten/ads/KiddyFirst";

export interface FooterAdsProps {
  /** 表示する広告の種類 */
  adTypes?: Array<"a8net" | "ninja" | "rakuten">;
  /** 広告を表示する条件を指定する関数 */
  shouldShowAd?: (adType: string) => boolean;
}

/**
 * フッター広告を表示するコンポーネント
 * 異なるプロバイダーの広告を管理・表示する
 */
export const FooterAds = memo(
  ({ adTypes = ["ninja"], shouldShowAd = () => true }: FooterAdsProps) => {
    return (
      <div className="flex flex-col items-center gap-8 mx-auto mb-12">
        {adTypes.includes("a8net") && shouldShowAd("a8net") && <DmmFx />}

        {adTypes.includes("rakuten") && shouldShowAd("rakuten") && (
          <KiddyFirst />
        )}

        {adTypes.includes("ninja") && shouldShowAd("ninja") && (
          <NinjaFooterAds />
        )}
      </div>
    );
  }
);

FooterAds.displayName = "FooterAds";
