import Image from "next/image";
import type { ImgHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export type MdxImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  basePath?: string;
};

export function Img({ basePath, src, width, height, className, ...props }: MdxImgProps) {
  const resolvedSrc =
    typeof src === "string"
      ? basePath && src.startsWith("./")
        ? `${basePath}/${src.replace(/^\.\//, "")}`
        : src
      : "";
  const resolvedWidth = typeof width === "number" ? width : 1200;
  const resolvedHeight = typeof height === "number" ? height : 675;

  return (
    <Image
      src={resolvedSrc}
      alt={props.alt ?? ""}
      width={resolvedWidth}
      height={resolvedHeight}
      className={cn("mx-auto block", className)}
      unoptimized
    />
  );
}
