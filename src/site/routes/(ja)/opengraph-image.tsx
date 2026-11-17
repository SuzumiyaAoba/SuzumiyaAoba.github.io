import { renderDefaultOpengraphImage } from "@/app/_shared/default-opengraph-image";

export { DEFAULT_OPENGRAPH_IMAGE_SIZE as size } from "@/app/_shared/default-opengraph-image";

export const contentType = "image/png";

export default async function Image() {
  return await renderDefaultOpengraphImage("ja");
}
