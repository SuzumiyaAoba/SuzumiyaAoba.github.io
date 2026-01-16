import BlogPage from "@/pages/blog/page";

type PageProps = {
  params: Promise<{ page: string }>;
};

export default function Page(props: PageProps) {
  return <BlogPage {...props} locale="en" />;
}
export * from "../../../blog/[page]/page";
