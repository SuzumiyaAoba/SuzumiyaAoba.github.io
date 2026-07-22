import type { Metadata } from "next";
import ToolsIndexPage from "@/pages/tools/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Tools",
  alternates: buildLocaleAlternates("/tools", "ja"),
};

export default function Page() {
  return <ToolsIndexPage locale="ja" />;
}
