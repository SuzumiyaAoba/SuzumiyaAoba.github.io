import type { Metadata } from "@/shared/lib/site/metadata";
import { redirect } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Notes",
  alternates: buildLocaleAlternates("/notes", "en"),
};

export default function Page() {
  redirect("/en/keywords/");
}
