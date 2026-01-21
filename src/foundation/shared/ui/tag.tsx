import { Icon } from "@iconify/react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";
import { badgeVariants } from "@/shared/ui/badge";

/**
 * タグごとのアイコンマッピング
 */
const TAG_ICON_MAP: Record<string, string> = {
  java: "skill-icons:java-light",
  scala: "devicon:scala",
  node: "fa-brands:node",
  react: "devicon:react",
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

/** デフォルトのタグアイコン */
const DEFAULT_ICON = "material-symbols:tag-rounded";

/**
 * Tag コンポーネントのプロップス
 */
type TagProps = {
  /** タグ名 */
  tag: string;
  /** 表示ラベル（省略時はタグ名を使用） */
  label?: string;
  /** リンク先のURL */
  href?: string;
  /** クラス名 */
  className?: string;
  /** アイコンに付与するクラス名 */
  iconClassName?: string;
} & VariantProps<typeof badgeVariants>;

/**
 * タグ名に対応するアイコンを解決する
 * @param tag タグ名
 * @returns アイコン名
 */
function resolveTagIcon(tag: string): string {
  const normalizedTag = tag.toLowerCase();
  return TAG_ICON_MAP[normalizedTag] ?? DEFAULT_ICON;
}

/**
 * 表示用ラベルを正規化する（#の削除など）
 * @param tag タグ名
 * @param label 指定されたラベル
 * @returns 正規化されたラベル
 */
function normalizeLabel(tag: string, label?: string): string {
  const resolved = label ?? tag;
  return resolved.startsWith("#") ? resolved.slice(1) : resolved;
}

/**
 * タグ表示用コンポーネント
 * @param props タグ名、ラベル、リンク、バリアントなど
 */
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
      <a href={href} className={cn(tagClassName, "transition-colors hover:text-foreground")}>
        {content}
      </a>
    );
  }

  return <span className={tagClassName}>{content}</span>;
}
