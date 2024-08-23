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

  return (
    <TwitterReactShareButton
      title={`${title} - ${config.metadata.title}`}
      url={currentUrl}
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
