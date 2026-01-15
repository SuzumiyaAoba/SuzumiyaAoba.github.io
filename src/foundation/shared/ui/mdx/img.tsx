"use client";
import Image from "next/image";
import type { ImgHTMLAttributes } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import { cn } from "@/shared/lib/utils";

export type MdxImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  basePath?: string;
};

export function Img({ basePath, src, width, height, className, ...props }: MdxImgProps) {
  const resolvedSrc =
    typeof src === "string"
      ? basePath && src.startsWith("./")
        ? `${basePath}/${src.replace(/^\.\//, "").replace(/\.(png|jpg|jpeg)$/i, ".webp")}`
        : src
      : "";
  const resolvedWidth = typeof width === "number" ? width : 1200;
  const resolvedHeight = typeof height === "number" ? height : 675;

  return (
    <span className="my-4 block">
      <Zoom>
        <Image
          src={resolvedSrc}
          alt={props.alt ?? ""}
          width={resolvedWidth}
          height={resolvedHeight}
          className={cn("mx-auto block", className)}
          unoptimized
        />
      </Zoom>
    </span>
  );
}
