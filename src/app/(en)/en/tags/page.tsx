import type { Metadata } from "next";
import TagsPage from "@/pages/tags/index";

export const metadata: Metadata = {
  title: "Tags",
};

export default function Page() {
  return <TagsPage locale="en" />;
}
