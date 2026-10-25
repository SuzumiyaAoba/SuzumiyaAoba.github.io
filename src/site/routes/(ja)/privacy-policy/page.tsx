import type { Metadata } from "@/shared/lib/site/metadata";
import PrivacyPolicyPage from "@/pages/site/privacy-policy";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: buildLocaleAlternates("/privacy-policy", "ja"),
};

export default function Page() {
  return <PrivacyPolicyPage locale="ja" />;
}
