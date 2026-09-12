import type { ContentFormat } from "@/shared/lib/content-file";

export type BookFrontmatter = {
  title: string;
  date?: string;
  category?: string;
  tags?: string[];
  /** その節を LLM を使って執筆したかどうか。書籍別 frontmatter `llm` をそのまま反映する。 */
  llm?: boolean;
  /** 執筆に使った LLM のモデル名（複数可）。frontmatter の `co-author` を反映する。 */
  coAuthors?: string[];
};

/** 書籍のトップ情報（概要 + frontmatter）。 */
export type BookMeta = {
  slug: string;
  frontmatter: BookFrontmatter;
  /** index.md の最初の区切り（\n---\n）より前の本文。書籍概要として表示する。 */
  lead: string;
};

/** 節の軽量参照情報（ナビゲーション用）。 */
export type SectionRef = {
  /** 章番号（ゼロ埋め2桁。例: "01"） */
  chapter: string;
  /** 節番号（ゼロ埋め2桁。例: "01"） */
  section: string;
  /** 節のタイトル */
  title: string;
};

/** 章タイトルと配下の節リスト。 */
export type BookChapter = {
  /** 章番号（ゼロ埋め2桁） */
  chapter: string;
  /** 章タイトル */
  title: string;
  /** この章に属する節のリスト */
  sections: SectionRef[];
};

/** 本文付きの節情報（ページ表示用）。 */
export type BookSection = SectionRef & {
  /** 節の本文（Markdown / MDX ソース） */
  content: string;
  format: ContentFormat;
  /** LLM を使って執筆した節かどうか（frontmatter `llm`）。 */
  llm?: boolean;
  /** 執筆に使った LLM モデル名（frontmatter `co-author`）。 */
  coAuthors?: string[];
};
