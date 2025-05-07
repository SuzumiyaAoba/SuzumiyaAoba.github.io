import Script from "next/script";

export const NinjaFooterAds = () => {
  return (
    <>
      <div
        className="admax-ads"
        data-admax-id="0aaa1bd19c79841f4e136fed588013e6"
        style={{ display: "inline-block", width: "728px", height: "90px" }}
      ></div>
      <Script id="NinjaAdsFooterScript" type="text/javascript">
        {`(admaxads = window.admaxads || []).push({admax_id: "0aaa1bd19c79841f4e136fed588013e6",type: "banner"});`}
      </Script>
      <Script
        type="text/javascript"
        src="https://adm.shinobi.jp/s/t.js"
        async
      />
    </>
  );
};
