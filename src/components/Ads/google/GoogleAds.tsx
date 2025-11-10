"use client";

import { useEffect, useRef } from "react";

export const ArticleFooter = () => {
  const pushedRef = useRef(false);
  useEffect(() => {
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
  }, []);

  return (
    <>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4374004258861110"
        crossOrigin="anonymous"
      ></script>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format="autorelaxed"
        data-ad-client="ca-pub-4374004258861110"
        data-ad-slot="9361206074"
      ></ins>
    </>
  );
};
