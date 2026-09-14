import { decodeTag } from "@/app/_shared/tag-page-metadata";
import { renderContentOpengraphImage } from "@/app/_shared/content-opengraph-image";

export { CONTENT_OPENGRAPH_IMAGE_SIZE as size } from "@/app/_shared/content-opengraph-image";

export { buildTagPageStaticParams as generateStaticParams } from "@/app/_shared/tag-page-metadata";

export const contentType = "image/png";
export const dynamic = "force-static";

export default async function Image({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return renderContentOpengraphImage({
    eyebrow: "Tag",
    title: `#${decodeTag(tag)}`,
  });
}
