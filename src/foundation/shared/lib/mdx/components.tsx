import type { MDXComponents } from "mdx/types";

import {
  Code,
  CodeSwitcher,
  CodeWithTabs,
  CodeWithTooltips,
  HoverContainer,
  InlineCode,
  MdxLabel,
  Mermaid,
  MdxLink,
  Tab,
  Tabs,
} from "@/shared/ui/mdx";
import { GitHubCodeLink } from "@/shared/ui/mdx/github-code-link";
import { MdxH2, MdxH3, MdxH4, MdxH5 } from "@/shared/ui/mdx/heading";
import { Img } from "@/shared/ui/mdx/img";
import { MdxTable } from "@/shared/ui/mdx/table";
import { ChatHistory } from "@/shared/ui/mdx/chat-history";
import { Message } from "@/shared/ui/mdx/message";
import { YouTubeEmbed } from "@/shared/ui/mdx/youtube-embed";
import { createPlaceholder } from "@/shared/ui/mdx/placeholders";
import * as FinancialData from "@/shared/ui/financial-data";

/**
 * プレースホルダーコンポーネントを生成するための名前リスト
 */
const placeholderNames = [
  "AGENTS",
  "DependencyInjectionPrinciplesPracticesAndPatterns",
  "LazyList",
  "List",
  "VisDotGraph",
  "TreeAutomatonTransition",
  "TweetCard",
  "F",
  "E",
  "K",
  "M",
  "T",
  "U",
  "String",
  "Integer",
  "Maybe",
  "Pattern",
];

/**
 * 動的に生成されたプレースホルダーコンポーネントのマップ
 */
const placeholders = Object.fromEntries(
  placeholderNames.map((name) => [name, createPlaceholder(name)]),
);

/**
 * MDX コンテンツで使用可能な React コンポーネントの定義
 *
 * Markdown 内で標準的な HTML タグ（a, img, h2 など）の代わりに
 * 独自にスタイリングされたコンポーネントを使用するために定義します。
 * また、カスタムコンポーネント（Code, Mermaid, YouTubeEmbed など）も提供します。
 */
export const mdxComponents: MDXComponents = {
  CodeWithTabs,
  CodeSwitcher,
  CodeWithTooltips,
  Code,
  InlineCode,
  HoverContainer,
  Mermaid,
  GitHubCodeLink,
  a: MdxLink,
  Img,
  img: Img,
  h2: MdxH2,
  h3: MdxH3,
  h4: MdxH4,
  h5: MdxH5,
  table: MdxTable,
  Message,
  Tab,
  Tabs,
  MdxLabel,
  YouTubeEmbed,
  ChatHistory,
  ...FinancialData,
  ...placeholders,
};
