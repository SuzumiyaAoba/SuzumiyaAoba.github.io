import type { Metadata } from "next";
import AiNewsPage from "@/pages/archive/ai-news";

export const metadata: Metadata = {
  title: "AI News",
};

export default function Page() {
  return <AiNewsPage locale="ja" />;
}
