import type { Metadata } from "next";
import AsciiStandardCodePage from "@/pages/tools/ascii-standard-code";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "ASCII Standard Code",
  alternates: buildLocaleAlternates("/tools/ascii-standard-code", "ja"),
};

export default function Page() {
  return <AsciiStandardCodePage locale="ja" />;
}
