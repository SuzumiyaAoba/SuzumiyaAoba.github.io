import { Boxes } from "lucide-react";
import { Icon } from "@/shared/ui/icon-client";
import { cn } from "@/shared/lib/utils";
import type { Locale } from "@/shared/lib/routing";
import type { Provider, ReleaseKind } from "../model/release-calendar";

const baseProviderStyles = {
  OpenAI: {
    icon: "logos:openai-icon",
    dot: "bg-emerald-600 dark:bg-emerald-400",
    badge:
      "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    border: "border-emerald-200 dark:border-emerald-800",
    ink: "text-emerald-700 dark:text-emerald-300",
  },
  Anthropic: {
    icon: "material-icon-theme:claude",
    dot: "bg-orange-600 dark:bg-orange-400",
    badge:
      "bg-orange-50 text-orange-950 dark:bg-orange-950 dark:text-orange-200",
    border: "border-orange-200 dark:border-orange-800",
    ink: "text-orange-700 dark:text-orange-300",
  },
  Google: {
    icon: "logos:google-icon",
    dot: "bg-blue-600 dark:bg-blue-400",
    badge: "bg-blue-50 text-blue-950 dark:bg-blue-950 dark:text-blue-200",
    border: "border-blue-200 dark:border-blue-800",
    ink: "text-blue-700 dark:text-blue-300",
  },
  DeepSeek: {
    icon: "ri:deepseek-fill",
    dot: "bg-violet-600 dark:bg-violet-400",
    badge:
      "bg-violet-50 text-violet-950 dark:bg-violet-950 dark:text-violet-200",
    border: "border-violet-200 dark:border-violet-800",
    ink: "text-violet-700 dark:text-violet-300",
  },
  Other: {
    icon: null,
    dot: "bg-slate-500 dark:bg-slate-400",
    badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    border: "border-slate-200 dark:border-slate-700",
    ink: "text-slate-700 dark:text-slate-300",
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
