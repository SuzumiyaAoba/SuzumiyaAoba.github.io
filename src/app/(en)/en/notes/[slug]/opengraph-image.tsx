import { getNoteSlugs, getNoteSummary } from "@/entities/note";
import {
  CONTENT_OPENGRAPH_IMAGE_SIZE,
  renderContentOpengraphImage,
} from "@/app/_shared/content-opengraph-image";

export const size = CONTENT_OPENGRAPH_IMAGE_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getNoteSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteSummary(slug, { locale: "en", fallback: true });
  return renderContentOpengraphImage({
    eyebrow: "Notes",
    title: note?.frontmatter.title || slug,
    tags: note?.frontmatter.tags ?? [],
  });
}
