import type { Metadata } from "next";
import PostsIndexPage from "@/pages/posts/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Posts",
  alternates: buildLocaleAlternates("/posts", "ja"),
};

export default function Page() {
  return <PostsIndexPage locale="ja" />;
}
