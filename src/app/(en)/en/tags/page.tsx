import type { Metadata } from "next";
import TagsPage from "@/pages/tags/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Tags",
  alternates: buildLocaleAlternates("/tags", "en"),
};

export default function Page() {
  return <TagsPage locale="en" />;
}
