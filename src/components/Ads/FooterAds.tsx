import { DmmFx } from "./DmmFx";
import { KiddyFirst } from "./rakuten/ads/KiddyFirst";

export const FooterAds = () => {
  return (
    <div className="flex flex-col items-center gap-8 mx-auto mb-12">
      <DmmFx />
      <KiddyFirst />
    </div>
  );
};
