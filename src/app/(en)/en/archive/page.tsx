import type { Metadata } from "next";
import ArchivePage from "@/pages/archive/index";

export const metadata: Metadata = {
  title: "Archive",
};

export default function Page() {
  return <ArchivePage locale="en" />;
}
