import type { Metadata } from "next";
import TagsIndexPage from "@/pages/tags/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Tags",
  alternates: buildLocaleAlternates("/tags", "ja"),
};

export default function Page() {
  return <TagsIndexPage locale="ja" />;
}
