import type { Metadata } from "@/shared/lib/site/metadata";
import AboutPage from "@/pages/site/about";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "About",
  alternates: buildLocaleAlternates("/about", "ja"),
};

export default function Page() {
  return <AboutPage locale="ja" />;
}
