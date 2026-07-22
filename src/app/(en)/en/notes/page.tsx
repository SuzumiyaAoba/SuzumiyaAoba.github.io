import type { Metadata } from "next";
import NotesPage from "@/pages/notes/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Notes",
  alternates: buildLocaleAlternates("/notes", "en"),
};

export default function Page() {
  return <NotesPage locale="en" />;
}
