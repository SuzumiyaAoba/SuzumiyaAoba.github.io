"use client";

import config from "@/config";
import { FC, useEffect, useState } from "react";
import { TwitterShareButton as TwitterReactShareButton } from "react-share";

const useCurrentUrl = () => {
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (process) {
      setCurrentUrl(window.location.href);
    }
  }, []);

  return [currentUrl, setCurrentUrl] as const;
};

const TwitterShareButton: FC<{
  title: string;
}> = ({ title }) => {
  const [currentUrl, _setCurrentUrl] = useCurrentUrl();

  // UTMパラメータを追加してTwitterからの流入を追跡
  const addUtmParams = (url: string) => {
    if (!url) return url;

    const urlObj = new URL(url);
    urlObj.searchParams.set("utm_source", "twitter");
    urlObj.searchParams.set("utm_medium", "social");
    urlObj.searchParams.set("utm_campaign", "share");

    return urlObj.toString();
  };

  return (
    <TwitterReactShareButton
      title={`${title} - ${config.metadata.title}`}
      url={addUtmParams(currentUrl)}
      related={["@SuzumiyaAoba"]}
    >
      <div className="text-sm flex items-center bg-black text-white px-1.5 py-1 rounded-md">
        <div className="i-simple-icons-x mr-1.5" />
        ポスト
      </div>
    </TwitterReactShareButton>
  );
};

export { TwitterShareButton };
