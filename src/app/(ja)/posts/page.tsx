import type { Metadata } from "next";
import PostsIndexPage from "@/pages/posts/index";

export const metadata: Metadata = {
  title: "Posts",
};

export default function Page() {
  return <PostsIndexPage locale="ja" />;
}
