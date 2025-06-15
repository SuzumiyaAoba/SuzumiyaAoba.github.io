"use client";

import { type FC } from "react";
import Link from "next/link";
import { exo_2 } from "@/fonts";
import clsx from "clsx";

type SiteLogoProps = {
  siteName: string;
};

export const SiteLogo: FC<SiteLogoProps> = ({ siteName }) => (
  <Link href="/">
    <div className="flex items-center space-x-2">
      <span
        className={clsx(
          "font-bold text-lg md:text-xl",
          exo_2.className
        )}
      >
        {siteName}
      </span>
    </div>
  </Link>
); 