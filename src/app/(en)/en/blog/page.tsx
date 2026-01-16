import type { Metadata } from "next";
import BlogListPage from "@/pages/blog/list";

export const metadata: Metadata = {
  title: "Blog",
};

export default function Page() {
  return <BlogListPage locale="en" />;
}
