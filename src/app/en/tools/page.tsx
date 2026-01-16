import type { Metadata } from "next";
import ToolsPage from "@/pages/tools/index";

export const metadata: Metadata = {
  title: "Tools",
};

export default function Page() {
  return <ToolsPage locale="en" />;
}
