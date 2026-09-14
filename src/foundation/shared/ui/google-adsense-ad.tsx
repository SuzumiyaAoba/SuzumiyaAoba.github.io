"use client";

import { useEffect, useRef, useState } from "react";
import { getSiteConfig } from "@/shared/lib/site/site-config";

export type GoogleAdsenseAdProps = {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "autorelaxed";
  responsive?: "true" | "false";
  style?: React.CSSProperties;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: { push: (options: Record<string, unknown>) => void };
  }
}

const DEFAULT_STYLE = { display: "block" } as const;

export function GoogleAdsenseAd({
  slot,
  format = "auto",
  responsive = "true",
  style = DEFAULT_STYLE,
  className,
}: GoogleAdsenseAdProps) {
  const [isMounted, setIsMounted] = useState(false);
  const pushedRef = useRef(false);
  const siteConfig = getSiteConfig();
  const clientId = siteConfig.googleAdsenseClientId;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !clientId) {
      return;
    }

    try {
      if (!pushedRef.current) {
        const pendingAds: Record<string, unknown>[] = [];
        (window.adsbygoogle ??= pendingAds).push({});
        pushedRef.current = true;
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Adsbygoogle push error:", error);
      }
    }
  }, [isMounted, clientId]);

  if (!clientId) {
    return null;
  }

  return (
    <div className={className} style={{ minHeight: style.height ?? "280px" }}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
