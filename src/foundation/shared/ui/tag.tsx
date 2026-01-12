import Link from "next/link";
import { Icon } from "@iconify/react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";
import { badgeVariants } from "@/shared/ui/badge";

const TAG_ICON_MAP: Record<string, string> = {
  java: "skill-icons:java-light",
  scala: "devicon:scala",
  node: "fa-brands:node",
  astro: "skill-icons:astro",
  "next.js": "devicon:nextjs",
  nix: "skill-icons:nix-light",
  tmux: "codicon:terminal-tmux",
  emacs: "logos:emacs",
  ollama: "simple-icons:ollama",
  "github copilot": "octicon:mark-github-16",
  llm: "ri:speak-ai-line",
  ローカルllm: "ri:speak-ai-line",
  生成ai: "ri:speak-ai-line",
  キーボード: "material-symbols:keyboard-outline",
  自作キーボード: "material-symbols:keyboard-outline",
  プログラミング: "material-symbols:code-blocks-outline",
  日記: "mingcute:diary-line",
  git: "devicon:git",
  "claude code": "material-icon-theme:claude",
  anthropic: "material-icon-theme:claude",
  gemini: "material-icon-theme:gemini-ai",
  chatgpt: "logos:openai-icon",
  openai: "logos:openai-icon",
  cursor: "vscode-icons:file-type-cursorrules",
};

const DEFAULT_ICON = "material-symbols:tag-rounded";

type TagProps = {
  tag: string;
  label?: string;
  href?: string;
  className?: string;
  iconClassName?: string;
} & VariantProps<typeof badgeVariants>;

function resolveTagIcon(tag: string): string {
  const normalizedTag = tag.toLowerCase();
  return TAG_ICON_MAP[normalizedTag] ?? DEFAULT_ICON;
}

function normalizeLabel(tag: string, label?: string): string {
  const resolved = label ?? tag;
  return resolved.startsWith("#") ? resolved.slice(1) : resolved;
}

export function Tag({
  tag,
  label,
  href,
  variant = "secondary",
  className,
  iconClassName,
}: TagProps) {
  const icon = resolveTagIcon(tag);
  const content = (
    <>
      <Icon icon={icon} className={cn("size-3.5 shrink-0", iconClassName)} aria-hidden />
      <span>{normalizeLabel(tag, label)}</span>
    </>
  );
  const tagClassName = cn(badgeVariants({ variant }), "gap-1.5 font-medium", className);

  if (href) {
    return (
      <Link href={href} className={cn(tagClassName, "transition-colors hover:text-foreground")}>
        {content}
      </Link>
    );
  }

  return <span className={tagClassName}>{content}</span>;
}
