import type { Metadata } from "next";
import PrivacyPolicyPage from "@/pages/site/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function Page() {
  return <PrivacyPolicyPage locale="en" />;
}
