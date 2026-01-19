import type { Metadata } from "next";
import ArchivePage from "@/pages/archive/index";

export const metadata: Metadata = {
  title: "アーカイブ",
};

export default function Page() {
  return <ArchivePage locale="ja" />;
}
