import Picture from "next-export-optimize-images/picture";
import { DetailedHTMLProps, FC, ImgHTMLAttributes } from "react";

export const SsgImage: FC<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
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
