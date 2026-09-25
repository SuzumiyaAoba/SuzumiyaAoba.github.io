import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Notes",
  alternates: buildLocaleAlternates("/notes", "en"),
};

export default function Page() {
  redirect("/en/keywords/");
}
