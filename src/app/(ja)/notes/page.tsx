import type { Metadata } from "next";
import NotesPage from "@/pages/notes/index";

export const metadata: Metadata = {
  title: "Notes",
};

export default function Page() {
  return <NotesPage />;
}
