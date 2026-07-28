import type { MDXComponents } from "mdx/types";

import {
  Code,
  HoverContainer,
  InlineCode,
  AmazonAssociate,
  AmazonProductSection,
  MdxDateLabel,
  MdxLabel,
  MdxLink,
  Tab,
  Tabs,
} from "@/shared/ui/mdx";
import { GitHubCodeLink } from "@/shared/ui/mdx/github-code-link";
import { MdxH1, MdxH2, MdxH3, MdxH4, MdxH5 } from "@/shared/ui/mdx/heading";
import { Img } from "@/shared/ui/mdx/img";
import { MdxTable } from "@/shared/ui/mdx/table";
import { ChatHistory } from "@/shared/ui/mdx/chat-history";
import { Column } from "@/shared/ui/mdx/column";
import { Message } from "@/shared/ui/mdx/message";
import { YouTubeEmbed } from "@/shared/ui/mdx/youtube-embed";
import { createPlaceholder } from "@/shared/ui/mdx/placeholders";


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
  // CodeWithTabs / CodeSwitcher / CodeWithTooltips は Shiki を伴うため、
  // 使用する記事だけに render-mdx.tsx が実行時注入する
  Code,
  InlineCode,
  HoverContainer,
  AmazonAssociate,
  AmazonProductSection,
  // Mermaid は重量のため、図を含む記事だけに render-mdx.tsx が実行時注入する
  GitHubCodeLink,
  a: MdxLink,
  Img,
  img: Img,
  h1: MdxH1,
  h2: MdxH2,
  h3: MdxH3,
  h4: MdxH4,
  h5: MdxH5,
  table: MdxTable,
  Message,
  Column,
  Tab,
  Tabs,
  MdxLabel,
  MdxDateLabel,
  YouTubeEmbed,
  ChatHistory,
  ...placeholders,
};
