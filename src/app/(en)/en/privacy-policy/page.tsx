import type { Metadata } from "next";
import PrivacyPolicyPage from "@/pages/site/privacy-policy";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: buildLocaleAlternates("/privacy-policy", "en"),
};

export default function Page() {
  return <PrivacyPolicyPage locale="en" />;
}
