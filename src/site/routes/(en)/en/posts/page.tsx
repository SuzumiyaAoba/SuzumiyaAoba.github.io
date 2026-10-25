import type { Metadata } from "@/shared/lib/site/metadata";
import PostsPage from "@/pages/posts/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Posts",
  alternates: buildLocaleAlternates("/posts", "en"),
};

export default function Page() {
  return <PostsPage locale="en" />;
}
