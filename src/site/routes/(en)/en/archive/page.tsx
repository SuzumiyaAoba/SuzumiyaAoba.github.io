import type { Metadata } from "@/shared/lib/site/metadata";
import ArchivePage from "@/pages/archive/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Archive",
  alternates: buildLocaleAlternates("/archive", "en"),
};

export default function Page() {
  return <ArchivePage locale="en" />;
}
