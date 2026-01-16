import type { Metadata } from "next";
import AboutPage from "@/pages/site/about";

export const metadata: Metadata = {
  title: "About",
};

export default function Page() {
  return <AboutPage locale="en" />;
}
