import { memo } from "react";
import { NinjaAdComponent } from "./NinjaAdComponent";

/**
 * 忍者Adsのフッター広告コンポーネント
 */
export const NinjaFooterAds = memo(() => {
  return (
    <NinjaAdComponent
      adId="0aaa1bd19c79841f4e136fed588013e6"
      width="728px"
      height="90px"
      description="忍者Ads フッター広告"
    />
  );
});

NinjaFooterAds.displayName = "NinjaFooterAds";
