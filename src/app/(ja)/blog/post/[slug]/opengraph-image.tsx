import {
  BLOG_POST_OPENGRAPH_IMAGE_SIZE,
  generateBlogPostOpengraphStaticParams,
  renderBlogPostOpengraphImage,
} from "@/app/_shared/blog-post-opengraph-image";

export const size = BLOG_POST_OPENGRAPH_IMAGE_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export const generateStaticParams = generateBlogPostOpengraphStaticParams;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderBlogPostOpengraphImage(slug, "ja");
}
