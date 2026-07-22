import type { Metadata } from "next";
import HomePage from "@/pages/site/home";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  alternates: buildLocaleAlternates("/", "ja"),
};

export default function Page() {
  return <HomePage locale="ja" />;
}
