import type { Metadata } from "@/shared/lib/site/metadata";
import AwesomeSomethingPage from "@/pages/awesome-something/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Awesome Something",
  description: "開発・デザイン・AI・データなど、分野別のリンク集。",
  alternates: buildLocaleAlternates("/awesome-something", "ja"),
};

export default function Page() {
  return <AwesomeSomethingPage locale="ja" />;
}
