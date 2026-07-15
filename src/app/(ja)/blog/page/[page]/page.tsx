import {
  buildBlogPageMetadata,
  buildBlogPageStaticParams,
} from "@/app/_shared/blog-page-static-params";
import BlogPage from "@/pages/blog/page";

export const generateMetadata = buildBlogPageMetadata;
export const generateStaticParams = buildBlogPageStaticParams;

type PageComponentProps = {
  params: Promise<{ page: string }>;
};

export default function Page(props: PageComponentProps) {
  return <BlogPage {...props} locale="ja" />;
}
