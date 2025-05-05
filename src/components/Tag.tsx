import { FC, memo } from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const TAG_LABELS = [
  "java",
  "scala",
  "node",
  "astro",
  "next.js",
  "nix",
  "tmux",
  "emacs",
  "ollama",
  "github copilot",
  "llm",
  "ローカルllm",
  "生成ai",
  "キーボード",
  "自作キーボード",
  "プログラミング",
  "日記",
] as const;

type TagLabel = (typeof TAG_LABELS)[number];

const toTypedTagLabel = (tag: string): TagLabel | undefined =>
  TAG_LABELS.find((it) => it === tag);

const tagToIcon = (tag: string) => {
  switch (toTypedTagLabel(tag.toLowerCase())) {
    case "java":
      return "i-skill-icons-java-light";
    case "scala":
      return "i-devicon-scala";
    case "node":
      return "i-fa-brands-node";
    case "astro":
      return "i-skill-icons-astro";
    case "next.js":
      return "i-devicon-nextjs";
    case "nix":
      return "i-skill-icons-nix-light";
    case "tmux":
      return "i-codicon-terminal-tmux";
    case "emacs":
      return "i-logos-emacs";
    case "ollama":
      return "i-simple-icons-ollama";
    case "github copilot":
      return "i-octicon-mark-github";
    case "llm":
    case "ローカルllm":
    case "生成ai":
      return "i-ri-speak-ai-line";
    case "キーボード":
    case "自作キーボード":
      return "i-material-symbols-keyboard-outline";
    case "プログラミング":
      return "i-material-symbols-code-blocks-outline";
    case "日記":
      return "i-mingcute-diary-line";
  }

  return "i-material-symbols:tag-rounded";
};

const tagVariants = cva(
  "flex w-fit break-keep items-center px-2 py-0.5 border border-neutral-400 rounded-md bg-neutral-100 transition-colors hover:bg-neutral-200",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
      variant: {
        default: "bg-neutral-100 hover:bg-neutral-200",
        primary: "bg-blue-100 border-blue-400 hover:bg-blue-200",
        secondary: "bg-green-100 border-green-400 hover:bg-green-200",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface TagProps extends VariantProps<typeof tagVariants> {
  label: string;
  href?: string;
  className?: string;
}

export const Tag: FC<TagProps> = memo(
  ({ label, href, size, variant, className }) => {
    const iconClass = cn(tagToIcon(label), "mr-1.5");
    const tagContent = (
      <>
        <span className={iconClass} />
        <span>{label}</span>
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={cn(tagVariants({ size, variant }), className)}
        >
          {tagContent}
        </Link>
      );
    }

    return (
      <span className={cn(tagVariants({ size, variant }), className)}>
        {tagContent}
      </span>
    );
  }
);

Tag.displayName = "Tag";
