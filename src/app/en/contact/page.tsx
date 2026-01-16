import type { Metadata } from "next";
import ContactPage from "@/pages/site/contact";

export const metadata: Metadata = {
  title: "Contact",
};

export default function Page() {
  return <ContactPage locale="en" />;
}
