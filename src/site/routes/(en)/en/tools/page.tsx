import type { Metadata } from "@/shared/lib/site/metadata";
import ToolsPage from "@/pages/tools/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Tools",
  alternates: buildLocaleAlternates("/tools", "en"),
};

export default function Page() {
  return <ToolsPage locale="en" />;
}
