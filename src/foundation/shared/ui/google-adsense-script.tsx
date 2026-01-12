import Script from "next/script";

export type GoogleAdsenseScriptProps = {
  clientId?: string;
};

export function GoogleAdsenseScript({ clientId }: GoogleAdsenseScriptProps) {
  if (!clientId) {
    return null;
  }

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      async
    />
  );
}
