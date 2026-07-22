import type { Metadata } from "next";
import HomePage from "@/pages/site/home";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Home",
  alternates: buildLocaleAlternates("/", "en"),
};

export default function Page() {
  return <HomePage locale="en" />;
}
