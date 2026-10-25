import BlogPage from "@/pages/blog/page";

export {
  buildBlogPageMetadata as generateMetadata,
  buildBlogPageStaticParams as generateStaticParams,
} from "@/app/_shared/blog-page-static-params";

type PageComponentProps = {
  params: Promise<{ page: string }>;
};

export default function Page(props: PageComponentProps) {
  return <BlogPage {...props} locale="ja" />;
}
