import dynamic from "next/dynamic";
import type { MDXComponents } from "mdx/types";

import {
  Code,
  CodeSwitcher,
  CodeWithTabs,
  CodeWithTooltips,
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
import { MdxH2, MdxH3, MdxH4, MdxH5 } from "@/shared/ui/mdx/heading";
import { Img } from "@/shared/ui/mdx/img";
import { MdxTable } from "@/shared/ui/mdx/table";
import { ChatHistory } from "@/shared/ui/mdx/chat-history";
import { Column } from "@/shared/ui/mdx/column";
import { Message } from "@/shared/ui/mdx/message";
import { YouTubeEmbed } from "@/shared/ui/mdx/youtube-embed";
import { createPlaceholder } from "@/shared/ui/mdx/placeholders";

/**
 * 重いコンポーネントを遅延読み込みする
 */
const Mermaid = dynamic(() => import("@/shared/ui/mdx/mermaid").then((mod) => mod.Mermaid));

/**
 * financial-data 系チャートのコンポーネントマップ。
 * 利用するページ（content/blog/2026-01-01-kakekin など）でのみ `extraComponents`
 * として渡して注入する。MDX 共通マップに常時注入するとブログ記事を編集した瞬間に
 * 100 件以上の dynamic import が HMR 対象になり、Chrome のレンダラーが OOM する。
 */
const FINANCIAL_CHART_NAMES = [
  "Section10ChartWrapper", "Section11ChartWrapper", "Section12ChartWrapper",
  "Section13ChartWrapper", "Section14ChartWrapper", "Section15ChartWrapper",
  "Section16ChartWrapper", "Section17ChartWrapper", "Section18ChartWrapper",
  "Section19ChartWrapper", "Section20ChartWrapper", "Section21ChartWrapper",
  "Section22ChartWrapper", "Section23ChartWrapper", "Section24ChartWrapper",
  "Section25ChartWrapper", "Section26ChartWrapper", "Section27ChartWrapper",
  "Section28ChartWrapper", "Section29ChartWrapper", "Section30ChartWrapper",
  "Section31ChartWrapper", "Section32ChartWrapper", "Section33ChartWrapper",
  "Section34ChartWrapper", "Section35ChartWrapper", "Section36ChartWrapper",
  "Section37ChartWrapper", "Section38ChartWrapper", "Section39ChartWrapper",
  "Section40ChartWrapper", "Section41ChartWrapper", "Section42ChartWrapper",
  "Section43ChartWrapper", "Section44ChartWrapper", "Section45ChartWrapper",
  "Section46ChartWrapper", "Section47ChartWrapper", "Section48ChartWrapper",
  "Section49ChartWrapper", "Section50ChartWrapper", "Section51ChartWrapper",
  "Section52ChartWrapper", "Section53ChartWrapper", "Section54ChartWrapper",
  "Section55ChartWrapper", "Section56ChartWrapper", "Section57ChartWrapper",
  "Section58ChartWrapper", "Section59ChartWrapper", "Section5ChartWrapper",
  "Section60ChartWrapper", "Section61ChartWrapper", "Section62ChartWrapper",
  "Section63ChartWrapper", "Section64ChartWrapper", "Section65ChartWrapper",
  "Section66ChartWrapper", "Section67ChartWrapper", "Section68ChartWrapper",
  "Section69ChartWrapper", "Section6ChartWrapper", "Section70ChartWrapper",
  "Section71ChartWrapper", "Section72ChartWrapper", "Section73ChartWrapper",
  "Section74ChartWrapper", "Section75ChartWrapper", "Section7ChartWrapper",
  "Section8ChartWrapper", "Section9ChartWrapper", "Sheet1BarLineChartWrapper",
  "Sheet1ChartWrapper", "Sheet1StackedChartWrapper", "Sheet2AmountChartWrapper",
  "Sheet2BarChartWrapper", "Sheet2ChartWrapper", "Sheet3AmountChartWrapper",
  "Sheet3BarChartWrapper", "Sheet3ChartWrapper", "Sheet3PieChartWrapper",
  "Sheet4AmountChartWrapper", "Sheet4BarChartWrapper", "Sheet4ChartWrapper",
  "Sheet4PieChartWrapper",
] as const;

export const financialDataComponents = Object.fromEntries(
  FINANCIAL_CHART_NAMES.map((name) => [
    name,
    dynamic(() =>
      import(`@/shared/ui/financial-data/${name}`).then(
        (mod) => mod[name] as React.ComponentType,
      ),
    ),
  ]),
) as MDXComponents;

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
  AmazonAssociate,
  AmazonProductSection,
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
  Column,
  Tab,
  Tabs,
  MdxLabel,
  MdxDateLabel,
  YouTubeEmbed,
  ChatHistory,
  ...placeholders,
};
