import type { Metadata } from "@/shared/lib/site/metadata";
import { LlmAnatomyLab } from "@/shared/ui/llm-anatomy/generation-lab";

export const metadata: Metadata = {
  title: "LLMの計算を追う — 入力から次のトークンまで",
  description:
    "全体の構造を確かめながら、数値が掛け算・加算・確率への変換を経て、次のトークンになるまでをアニメーションで追う。",
  alternates: { canonical: "/tools/llm-anatomy/" },
};

export default function Page() {
  return <LlmAnatomyLab />;
}
