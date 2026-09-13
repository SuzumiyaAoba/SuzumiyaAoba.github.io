import type { Metadata } from "next";
import AwesomeSomethingPage from "@/pages/awesome-something/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Awesome Something",
  description:
    "A collection of services, libraries, frameworks, and applications, with useful articles and related posts from this site.",
  alternates: buildLocaleAlternates("/awesome-something", "en"),
};

export default function Page() {
  return <AwesomeSomethingPage locale="en" />;
}
