"use client";

import { FC, useEffect, useState } from "react";
import { HatenaIcon, HatenaShareButton, HatenaShareCount } from "react-share";

const HatenaButton: FC<{}> = ({}) => {
  const [currentUrl, setCurrentUrl] = useState("");
  useEffect(() => {
    if (process) {
      setCurrentUrl(window.location.href);
    }
  }, []);

  return (
    <HatenaShareButton url={currentUrl}>
      <div className="flex border rounded-md">
        <HatenaIcon className="rounded-l-md border" size={28} />
        <HatenaShareCount className="px-4" url={currentUrl} />
      </div>
    </HatenaShareButton>
  );
};

export { HatenaButton };
