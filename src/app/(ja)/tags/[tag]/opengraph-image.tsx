import { decodeTag, buildTagPageStaticParams } from "@/app/_shared/tag-page-metadata";
import {
  CONTENT_OPENGRAPH_IMAGE_SIZE,
  renderContentOpengraphImage,
} from "@/app/_shared/content-opengraph-image";

export const size = CONTENT_OPENGRAPH_IMAGE_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export const generateStaticParams = buildTagPageStaticParams;

export default async function Image({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return renderContentOpengraphImage({
    eyebrow: "タグ",
    title: `#${decodeTag(tag)}`,
  });
}
