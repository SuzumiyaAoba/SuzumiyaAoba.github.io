"use client";

import { useEffect, useRef, useState } from "react";
import { getSiteConfig } from "@/shared/lib/site-config";

export interface GoogleAdsenseAdProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "autorelaxed";
  responsive?: "true" | "false";
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function GoogleAdsenseAd({
  slot,
  format = "auto",
  responsive = "true",
  style = { display: "block" },
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
    if (!isMounted || !clientId) return;

    try {
      if (!pushedRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Adsbygoogle push error:", e);
      }
    }
  }, [isMounted, clientId]);

  if (!clientId) {
    return null;
  }

  return (
    <div className={className}>
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
