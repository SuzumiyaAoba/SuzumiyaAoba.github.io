import { DmmFx } from "./DmmFx";
import { NinjaFooterAds } from "./Ninja/NinjaFooterAds";
import { KiddyFirst } from "./rakuten/ads/KiddyFirst";

export const FooterAds = () => {
  return (
    <div className="hidden md:flex flex-col items-center gap-8 mx-auto mb-12">
      {/* <DmmFx /> */}
      {/*<KiddyFirst />*/}
      <NinjaFooterAds />
    </div>
  );
};
