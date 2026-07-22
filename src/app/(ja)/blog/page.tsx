import type { Metadata } from "next";
import BlogListPage from "@/pages/blog/list";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Blog",
  alternates: buildLocaleAlternates("/blog", "ja"),
};

export default function Page() {
  return <BlogListPage locale="ja" />;
}
