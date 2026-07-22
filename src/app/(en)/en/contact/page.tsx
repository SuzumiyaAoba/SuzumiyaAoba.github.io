import type { Metadata } from "next";
import ContactPage from "@/pages/site/contact";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Contact",
  alternates: buildLocaleAlternates("/contact", "en"),
};

export default function Page() {
  return <ContactPage locale="en" />;
}
