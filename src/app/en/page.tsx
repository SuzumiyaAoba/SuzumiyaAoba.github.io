import type { Metadata } from "next";
import HomePage from "@/pages/site/home";

export const metadata: Metadata = {
  title: "Home",
};

export default function Page() {
  return <HomePage locale="en" />;
}
