import { Boxes } from "lucide-react";
import { Icon } from "@/shared/ui/icon-client";
import { cn } from "@/shared/lib/utils";
import type { Locale } from "@/shared/lib/routing";
import type { Provider, ReleaseKind } from "../model/release-calendar";

const baseProviderStyles = {
  OpenAI: {
    icon: "logos:openai-icon",
    dot: "bg-provider-openai",
    badge: "bg-provider-openai-soft text-provider-openai-ink",
    border: "border-provider-openai-border",
    ink: "text-provider-openai-ink",
  },
  Anthropic: {
    icon: "material-icon-theme:claude",
    dot: "bg-provider-anthropic",
    badge: "bg-provider-anthropic-soft text-provider-anthropic-ink",
    border: "border-provider-anthropic-border",
    ink: "text-provider-anthropic-ink",
  },
  Google: {
    icon: "logos:google-icon",
    dot: "bg-provider-google",
    badge: "bg-provider-google-soft text-provider-google-ink",
    border: "border-provider-google-border",
    ink: "text-provider-google-ink",
  },
  DeepSeek: {
    icon: "ri:deepseek-fill",
    dot: "bg-provider-deepseek",
    badge: "bg-provider-deepseek-soft text-provider-deepseek-ink",
    border: "border-provider-deepseek-border",
    ink: "text-provider-deepseek-ink",
  },
  Other: {
    icon: null,
    dot: "bg-provider-other",
    badge: "bg-provider-other-soft text-provider-other-ink",
    border: "border-provider-other-border",
    ink: "text-provider-other-ink",
  },
};

export const providerStyles = {
  ...baseProviderStyles,
  Alibaba: { ...baseProviderStyles.DeepSeek, icon: "ri:qwen-ai-fill" },
  "Moonshot AI": { ...baseProviderStyles.Other, icon: "simple-icons:kimi" },
  Meta: { ...baseProviderStyles.Google, icon: "logos:meta" },
  "Mistral AI": {
    ...baseProviderStyles.Anthropic,
    icon: "logos:mistral-ai-icon",
  },
  xAI: { ...baseProviderStyles.Other, icon: "ri:grok-ai-fill" },
  "Z.ai": { ...baseProviderStyles.Google, icon: "ri:zhipu-ai-fill" },
  MiniMax: { ...baseProviderStyles.Anthropic, icon: "simple-icons:minimax" },
  Microsoft: { ...baseProviderStyles.Google, icon: "logos:microsoft" },
  Cohere: { ...baseProviderStyles.OpenAI, icon: null },
  "AI21 Labs": { ...baseProviderStyles.DeepSeek, icon: null },
  Amazon: { ...baseProviderStyles.Anthropic, icon: "ri:amazon-fill" },
  NVIDIA: { ...baseProviderStyles.OpenAI, icon: "simple-icons:nvidia" },
  IBM: { ...baseProviderStyles.Google, icon: "simple-icons:ibm" },
  Ai2: { ...baseProviderStyles.OpenAI, icon: null },
  "Hugging Face": {
    ...baseProviderStyles.Anthropic,
    icon: "logos:hugging-face-icon",
  },
  Tencent: { ...baseProviderStyles.Google, icon: null },
  Baidu: { ...baseProviderStyles.Google, icon: "ri:baidu-fill" },
  "01.AI": { ...baseProviderStyles.DeepSeek, icon: null },
  TII: { ...baseProviderStyles.OpenAI, icon: null },
  Databricks: {
    ...baseProviderStyles.Anthropic,
    icon: "simple-icons:databricks",
  },
  "Preferred Networks": { ...baseProviderStyles.OpenAI, icon: null },
  ELYZA: { ...baseProviderStyles.Google, icon: null },
  "SB Intuitions": { ...baseProviderStyles.Other, icon: null },
  "LLM-jp": { ...baseProviderStyles.DeepSeek, icon: null },
} satisfies Record<
  Provider,
  {
    icon: string | null;
    dot: string;
    badge: string;
    border: string;
    ink: string;
  }
>;

export function ProviderIcon({
  provider,
  className,
  plain = false,
}: {
  provider: Provider;
  className?: string;
  plain?: boolean;
}) {
  const style = providerStyles[provider];
  return (
    <span
      aria-hidden="true"
      data-provider-icon={provider}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
        !plain && style.badge,
        className
      )}
    >
      {style.icon ? (
        <Icon icon={style.icon} className="h-[60%] w-[60%]" aria-hidden />
      ) : (
        <Boxes className="h-[60%] w-[60%]" aria-hidden="true" />
      )}
    </span>
  );
}

export function providerLabel(provider: Provider, locale: Locale) {
  return provider === "Other"
    ? locale === "en"
      ? "Other"
      : "その他"
    : provider;
}

export function kindLabel(kind: ReleaseKind, locale: Locale) {
  return {
    llm: "LLM",
    image: locale === "en" ? "Image" : "画像",
    audio: locale === "en" ? "Audio" : "音声",
    agent: locale === "en" ? "Agent" : "エージェント",
    other: locale === "en" ? "Other" : "その他",
  }[kind];
}
