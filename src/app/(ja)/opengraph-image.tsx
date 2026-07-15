import {
  DEFAULT_OPENGRAPH_IMAGE_SIZE,
  renderDefaultOpengraphImage,
} from "@/app/_shared/default-opengraph-image";

export const size = DEFAULT_OPENGRAPH_IMAGE_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function Image() {
  return renderDefaultOpengraphImage();
}
