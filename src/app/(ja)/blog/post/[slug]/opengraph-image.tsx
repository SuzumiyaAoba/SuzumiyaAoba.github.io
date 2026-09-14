import { renderBlogPostOpengraphImage } from "@/app/_shared/blog-post-opengraph-image";

export {
  BLOG_POST_OPENGRAPH_IMAGE_SIZE as size,
  generateBlogPostOpengraphStaticParams as generateStaticParams,
} from "@/app/_shared/blog-post-opengraph-image";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderBlogPostOpengraphImage(slug, "ja");
}
