import Picture from "next-export-optimize-images/picture";
import {
  StaticImageData,
  StaticRequire,
} from "next/dist/shared/lib/get-img-props";
import { DetailedHTMLProps, FC, ImgHTMLAttributes } from "react";

export const SsgImage: FC<
  Omit<
    DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
    "src"
  > & {
    src: string | StaticRequire | StaticImageData;
  }
> = (props) => {
  return (
    <Picture
      {...props}
      alt={props.alt ?? ""}
      width={props.width as number}
      height={props.height as number}
      style={{
        objectFit: "contain",
        position: "relative",
      }}
    />
  );
};
