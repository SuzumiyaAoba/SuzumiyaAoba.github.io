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

// タグとアイコンクラスのマッピング
const TAG_ICON_MAP: Record<string, string> = {
  java: "i-skill-icons-java-light",
  scala: "i-devicon-scala",
  node: "i-fa-brands-node",
  astro: "i-skill-icons-astro",
  "next.js": "i-devicon-nextjs",
  nix: "i-skill-icons-nix-light",
  tmux: "i-codicon-terminal-tmux",
  emacs: "i-logos-emacs",
  ollama: "i-simple-icons-ollama",
  "github copilot": "i-octicon-mark-github",
  llm: "i-ri-speak-ai-line",
  ローカルllm: "i-ri-speak-ai-line",
  生成ai: "i-ri-speak-ai-line",
  キーボード: "i-material-symbols-keyboard-outline",
  自作キーボード: "i-material-symbols-keyboard-outline",
  プログラミング: "i-material-symbols-code-blocks-outline",
  日記: "i-mingcute-diary-line",
};

const DEFAULT_ICON = "i-material-symbols:tag-rounded";

interface TagToIconProps {
  tag: string;
}

const tagToIcon = ({ tag }: TagToIconProps) => {
  const normalizedTag = tag.toLowerCase();
  const typedTag = toTypedTagLabel(normalizedTag);

  return typedTag && TAG_ICON_MAP[typedTag]
    ? TAG_ICON_MAP[typedTag]
    : DEFAULT_ICON;
};

const tagVariants = cva(
  "flex w-fit break-keep items-center px-2 py-0.5 border border-neutral-400 rounded-md bg-neutral-100 transition-colors hover:bg-neutral-200 text-neutral-900 font-normal",
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

// インラインスタイルでリンクのスタイルを上書き
const tagLinkStyle = {
  textDecoration: "none",
  color: "#171717", // text-neutral-900 相当
  fontWeight: "normal",
};

export interface TagProps extends VariantProps<typeof tagVariants> {
  label: string;
  href?: string;
  className?: string;
}

export const Tag: FC<TagProps> = memo(
  ({ label, href, size, variant, className }) => {
    const iconClass = cn(tagToIcon({ tag: label }), "mr-1.5");

    // タグコンテンツの共通化
    interface CreateTagContentProps {
      iconClass: string;
      label: string;
    }

    const createTagContent = ({ iconClass, label }: CreateTagContentProps) => (
      <>
        <span className={iconClass} />
        <span>{label}</span>
      </>
    );

    const tagContent = createTagContent({ iconClass, label });

    if (href) {
      return (
        <Link
          href={href}
          className={cn(
            tagVariants({ size, variant }),
            "no-underline text-neutral-900 font-normal",
            className
          )}
          style={tagLinkStyle}
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
