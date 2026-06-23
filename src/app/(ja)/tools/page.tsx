import type { Metadata } from "next";
import ToolsIndexPage from "@/pages/tools/index";

export const metadata: Metadata = {
  title: "Tools",
};

export default function Page() {
  return <ToolsIndexPage locale="ja" />;
}
