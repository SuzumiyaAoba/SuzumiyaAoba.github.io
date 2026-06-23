import type { Metadata } from "next";
import TagsIndexPage from "@/pages/tags/index";

export const metadata: Metadata = {
  title: "Tags",
};

export default function Page() {
  return <TagsIndexPage locale="ja" />;
}
