import Image from "next/image";
import {
  StaticImageData,
  StaticRequire,
} from "next/dist/shared/lib/get-img-props";
import { DetailedHTMLProps, FC, ImgHTMLAttributes } from "react";

type SsgImageProps = Omit<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
  "src"
> & {
  src: string | StaticRequire | StaticImageData;
};

export const SsgImage: FC<SsgImageProps> = (props) => {
  const { src, alt, width, height, style, ...rest } = props;

  // 全てのケースでNext.js Imageコンポーネントを使用
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={(width as number) || 800}
      height={(height as number) || 600}
      style={{
        objectFit: "contain",
        position: "relative",
        maxWidth: "100%",
        ...style,
      }}
      {...rest}
    />
  );
};
