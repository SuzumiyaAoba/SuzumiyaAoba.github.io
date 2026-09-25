import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Notes",
  alternates: buildLocaleAlternates("/notes", "ja"),
};

export default function Page() {
  redirect("/keywords/");
}
