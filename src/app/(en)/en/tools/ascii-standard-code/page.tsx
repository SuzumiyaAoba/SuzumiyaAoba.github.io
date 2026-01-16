import type { Metadata } from "next";
import AsciiStandardCodePage from "@/pages/tools/ascii-standard-code";

export const metadata: Metadata = {
  title: "ASCII Standard Code",
};

export default function Page() {
  return <AsciiStandardCodePage locale="en" />;
}
