import { SsgImage } from "@/components/SsgImage";

interface ImgProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  basePath?: string;
}

export const Img = ({ src, alt, width, height, basePath }: ImgProps) => {
  return <SsgImage src={src} alt={alt} width={width} height={height} basePath={basePath} />;
};
