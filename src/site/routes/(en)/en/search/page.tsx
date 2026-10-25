import type { Metadata } from "@/shared/lib/site/metadata";
import SearchPage from "@/pages/site/search";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Search",
  alternates: buildLocaleAlternates("/search", "en"),
};

export default function Page() {
  return <SearchPage locale="en" />;
}
