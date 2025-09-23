import { FC, memo } from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/libs/utils";

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
  git: "i-devicon-git",
  "claude code": "i-material-icon-theme:claude",
};

type TagLabel = (typeof TAG_ICON_MAP)[keyof typeof TAG_ICON_MAP];

const toTypedTagLabel = (tag: string): TagLabel | undefined =>
  Object.keys(TAG_ICON_MAP).find((it) => it === tag);

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

// ダークテーマに対応したタグのスタイル
const tagVariants = cva(
  "flex w-fit break-keep items-center px-2 py-0.5 rounded-md transition-colors font-normal",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
      variant: {
        default: "",
        primary: "",
        secondary: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

// タグのスタイル（CSS変数を使用）
const getTagStyle = (variant: string = "default") => {
  const baseStyle = {
    backgroundColor: "var(--card-bg)",
    color: "var(--foreground)",
    borderColor: "var(--border)",
    border: "1px solid var(--border)",
  };

  switch (variant) {
    case "primary":
      return {
        ...baseStyle,
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        borderColor: "var(--accent-primary)",
      };
    case "secondary":
      return {
        ...baseStyle,
        backgroundColor: "rgba(34, 211, 238, 0.2)",
        borderColor: "var(--accent-secondary)",
      };
    default:
      return baseStyle;
  }
};

// タグリンクのスタイル
const getTagLinkStyle = (variant: string = "default") => {
  return {
    ...getTagStyle(variant),
    textDecoration: "none",
    fontWeight: "normal",
  };
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
    const variantName = variant || "default";

    if (href) {
      return (
        <Link
          href={href}
          className={cn(
            tagVariants({ size, variant }),
            "no-underline font-normal hover:opacity-90",
            className
          )}
          style={getTagLinkStyle(variantName)}
        >
          {tagContent}
        </Link>
      );
    }

    return (
      <span
        className={cn(tagVariants({ size, variant }), className)}
        style={getTagStyle(variantName)}
      >
        {tagContent}
      </span>
    );
  }
);

Tag.displayName = "Tag";
