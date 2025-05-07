import Script from "next/script";

export const GoogleAdsenseScript = () => {
  return (
    <Script
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4374004258861110"
      crossOrigin="anonymous"
      async
    />
  );
};
