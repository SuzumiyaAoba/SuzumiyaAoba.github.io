import type { Metadata } from "@/shared/lib/site/metadata";
import PostsIndexPage from "@/pages/posts/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Posts",
  alternates: buildLocaleAlternates("/posts", "ja"),
};

export default function Page() {
  return <PostsIndexPage locale="ja" />;
}
