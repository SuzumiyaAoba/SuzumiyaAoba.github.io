import type { Metadata } from "next";
import AwesomeSomethingPage from "@/pages/awesome-something/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Awesome Something",
  description: "Services, libraries, frameworks, and applications.",
  alternates: buildLocaleAlternates("/awesome-something", "en"),
};

export default function Page() {
  return <AwesomeSomethingPage locale="en" />;
}
