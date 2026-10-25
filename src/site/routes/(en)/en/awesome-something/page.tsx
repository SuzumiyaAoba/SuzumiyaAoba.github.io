import type { Metadata } from "@/shared/lib/site/metadata";
import AwesomeSomethingPage from "@/pages/awesome-something/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Awesome Something",
  description:
    "Links to tools and resources, grouped by topic: development, design, AI, data, and more.",
  alternates: buildLocaleAlternates("/awesome-something", "en"),
};

export default function Page() {
  return <AwesomeSomethingPage locale="en" />;
}
