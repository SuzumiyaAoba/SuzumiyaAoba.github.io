import { getPublishedNoteSlugs, getNoteSummary } from "@/entities/note";
import { renderContentOpengraphImage } from "@/app/_shared/content-opengraph-image";

export { CONTENT_OPENGRAPH_IMAGE_SIZE as size } from "@/app/_shared/content-opengraph-image";

export const contentType = "image/png";
export const dynamic = "force-static";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getPublishedNoteSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await getNoteSummary(slug, { locale: "en", fallback: true });
  return await renderContentOpengraphImage({
    eyebrow: "Notes",
    title: note?.frontmatter.title || slug,
    tags: note?.frontmatter.tags ?? [],
  });
}
