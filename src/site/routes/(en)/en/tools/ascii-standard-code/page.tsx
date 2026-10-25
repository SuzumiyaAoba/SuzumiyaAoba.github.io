import type { Metadata } from "@/shared/lib/site/metadata";
import AsciiStandardCodePage from "@/pages/tools/ascii-standard-code";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "ASCII Standard Code",
  alternates: buildLocaleAlternates("/tools/ascii-standard-code", "en"),
};

export default function Page() {
  return <AsciiStandardCodePage locale="en" />;
}
