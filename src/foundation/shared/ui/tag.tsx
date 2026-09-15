import { Icon } from "@/shared/ui/icon";
import type { VariantProps } from "class-variance-authority";

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
  claude: "material-icon-theme:claude",
  "claude opus": "material-icon-theme:claude",
  "claude sonnet": "material-icon-theme:claude",
  "claude haiku": "material-icon-theme:claude",
  anthropic: "material-icon-theme:claude",
  codex: "logos:openai-icon",
  gpt: "logos:openai-icon",
  google: "logos:google-icon",
  gemini: "material-icon-theme:gemini-ai",
  chatgpt: "logos:openai-icon",
  openai: "logos:openai-icon",
  cursor: "vscode-icons:file-type-cursorrules",
  deepseek: "ri:deepseek-fill",
  "nano banana": "lucide:banana",

  // 言語・プラットフォーム・ツール
  html: "devicon:html5",
  css: "devicon:css3",
  javascript: "devicon:javascript",
  typescript: "devicon:typescript",
  go: "devicon:go",
  rust: "simple-icons:rust",
  zig: "devicon:zig",
  ocaml: "devicon:ocaml",
  webassembly: "simple-icons:webassembly",
  github: "simple-icons:github",
  "github actions": "simple-icons:githubactions",
  cloudflare: "devicon:cloudflare",
  "cloudflare workers": "devicon:cloudflareworkers",
  markdown: "simple-icons:markdown",
  mdx: "simple-icons:mdx",
  sqlite: "simple-icons:sqlite",
  postgresql: "devicon:postgresql",
  pgvector: "lucide:database-search",
  lancedb: "lucide:database",
  mcp: "simple-icons:modelcontextprotocol",
  langgraph: "simple-icons:langgraph",
  openclaw: "lucide:bot",
  "hugging face": "devicon:huggingface",
  openapi: "simple-icons:openapiinitiative",
  graphql: "simple-icons:graphql",
  macos: "simple-icons:apple",
  android: "devicon:android",
  figma: "devicon:figma",
  "tailwind css": "devicon:tailwindcss",
  svg: "simple-icons:svg",
  "shadcn/ui": "simple-icons:shadcnui",
  "base ui": "simple-icons:baseui",
  motion: "devicon:motion",
  "material design": "simple-icons:materialdesign",
  obsidian: "simple-icons:obsidian",

  // AI・メモリ・検索
  aiエージェント: "lucide:bot",
  マルチエージェント: "lucide:network",
  aiコーディング: "lucide:bot-message-square",
  永続メモリ: "lucide:brain",
  コンテキスト管理: "lucide:layers",
  コンテキスト圧縮: "lucide:minimize-2",
  パーソナライズ: "lucide:user-round-cog",
  ナレッジ管理: "lucide:book-open",
  ナレッジ共有: "lucide:book-open-check",
  知識グラフ: "lucide:network",
  経験学習: "lucide:graduation-cap",
  ファインチューニング: "lucide:sliders-horizontal",
  マルチモーダル: "lucide:blocks",
  推論: "lucide:brain-circuit",
  プロンプト: "lucide:message-square-text",
  プロンプト最適化: "lucide:message-square-code",
  モデル比較: "lucide:git-compare-arrows",
  スキル: "lucide:puzzle",
  rag: "lucide:book-search",
  検索: "lucide:search",
  ベクトル検索: "lucide:database-search",
  ハイブリッド検索: "lucide:search-code",
  全文検索: "lucide:text-search",
  コード検索: "lucide:file-search-corner",
  情報収集: "lucide:scan-search",
  情報抽出: "lucide:list-filter",
  リサーチ: "lucide:search-check",
  論文: "lucide:scroll-text",
  因果関係: "lucide:git-branch",
  シミュレーション: "lucide:flask-conical",

  // 開発・データ・運用
  cli: "lucide:terminal",
  ターミナル: "lucide:terminal",
  api: "lucide:plug",
  sdk: "lucide:package",
  web: "lucide:globe",
  web開発: "lucide:globe",
  モバイル: "lucide:smartphone",
  デスクトップ: "lucide:monitor",
  gui: "lucide:app-window",
  セルフホスト: "lucide:server",
  ホスティング: "lucide:cloud-upload",
  ローカルファースト: "lucide:hard-drive",
  オフライン: "lucide:wifi-off",
  ストレージ: "lucide:hard-drive",
  ファイルシステム: "lucide:folder-tree",
  データベース: "lucide:database",
  sql: "lucide:database",
  グラフデータベース: "lucide:network",
  スキーマ管理: "lucide:table-properties",
  データ同期: "lucide:refresh-cw",
  インデックス: "lucide:list-ordered",
  状態管理: "lucide:toggle-left",
  自動化: "lucide:zap",
  ワークフロー: "lucide:workflow",
  仕様駆動開発: "lucide:clipboard-list",
  バージョン管理: "lucide:git-branch",
  テスト自動化: "lucide:flask-conical",
  バリデーション: "lucide:badge-check",
  デバッグ: "lucide:bug",
  コード解析: "lucide:code-xml",
  コードレビュー: "lucide:git-pull-request",
  ci: "lucide:circle-check",
  正規表現: "lucide:regex",
  クラス名: "lucide:braces",
  ユーティリティ: "lucide:wrench",
  ドキュメント生成: "lucide:file-code",
  静的サイト生成: "lucide:files",
  c4モデル: "lucide:boxes",
  サンドボックス: "lucide:box",
  認証: "lucide:key-round",
  アクセス制御: "lucide:shield-check",
  暗号化: "lucide:lock-keyhole",
  承認フロー: "lucide:clipboard-check",
  タスク管理: "lucide:list-todo",
  コスト管理: "lucide:wallet",
  crdt: "lucide:git-merge",
  共同編集: "lucide:users",
  増分計算: "lucide:refresh-cw",

  // コミュニケーション・文書・メディア
  チャット: "lucide:messages-square",
  対話: "lucide:messages-square",
  ユーザープロファイル: "lucide:contact-round",
  sns: "lucide:share-2",
  wiki: "lucide:book-open",
  zettelkasten: "lucide:library",
  文書処理: "lucide:file-text",
  文書生成: "lucide:file-pen-line",
  リンク集: "lucide:link",
  無料リソース: "lucide:gift",
  ライティング: "lucide:pen-line",
  組版: "lucide:type",
  日本語: "lucide:languages",
  日時: "lucide:clock",
  時系列: "lucide:history",
  カレンダー: "lucide:calendar-days",
  音声合成: "lucide:speech",
  ボイスクローニング: "lucide:mic",
  ショート動画: "lucide:clapperboard",
  動画編集: "lucide:film",
  ストリーミング: "lucide:radio",
  スクリーンショット: "lucide:camera",
  画面録画: "lucide:screen-share",
  ocr: "lucide:scan-text",

  // デザイン・可視化
  市場分析: "lucide:chart-candlestick",
  経済データ: "lucide:chart-no-axes-combined",
  グラフ: "lucide:network",
  可視化: "lucide:chart-no-axes-combined",
  チャート: "lucide:chart-pie",
  ダッシュボード: "lucide:layout-dashboard",
  seo: "lucide:search-check",
  アクセシビリティ: "lucide:accessibility",
  ポートフォリオ: "lucide:briefcase-business",
  "design.md": "lucide:file-pen-line",
  デザインシステム: "lucide:component",
  デザインリソース: "lucide:palette",
  デザイン抽出: "lucide:pipette",
  プロトタイピング: "lucide:pencil-ruler",
  ui: "lucide:panels-top-left",
  ux: "lucide:mouse-pointer-click",
  uiコンポーネント: "lucide:blocks",
  スライド: "lucide:presentation",
  ギャラリー: "lucide:images",
  アニメーション: "lucide:activity",
  視覚効果: "lucide:sparkles",
  カラーパレット: "lucide:palette",
  デザイントークン: "lucide:swatch-book",
  図解: "lucide:shapes",
  テンプレート: "lucide:layout-template",
  ピクセルアート: "lucide:grid-2x2",
  レトロ: "lucide:gamepad-2",
  フォーム: "lucide:text-cursor-input",
  インタラクション: "lucide:mouse-pointer-click",
  注釈: "lucide:message-square-more",
  手描き風: "lucide:pencil",
  パネル: "lucide:panels-left-bottom",
  ミニマルデザイン: "lucide:minus",
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
      <Icon
        icon={icon}
        className={cn("size-3.5 shrink-0", iconClassName)}
        aria-hidden
      />
      <span>{normalizeLabel(tag, label)}</span>
    </>
  );
  const tagClassName = cn(
    badgeVariants({ variant }),
    "gap-1.5 font-medium",
    className
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(tagClassName, "transition-colors hover:text-foreground")}
      >
        {content}
      </a>
    );
  }

  return <span className={tagClassName}>{content}</span>;
}
