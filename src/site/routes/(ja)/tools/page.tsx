import type { Metadata } from "@/shared/lib/site/metadata";
import ToolsIndexPage from "@/pages/tools/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Tools",
  alternates: buildLocaleAlternates("/tools", "ja"),
};

export default function Page() {
  return <ToolsIndexPage locale="ja" />;
}
