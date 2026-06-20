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
export const financialDataComponents = {
  Section10ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section10ChartWrapper").then((mod) => mod.Section10ChartWrapper),
  ),
  Section11ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section11ChartWrapper").then((mod) => mod.Section11ChartWrapper),
  ),
  Section12ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section12ChartWrapper").then((mod) => mod.Section12ChartWrapper),
  ),
  Section13ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section13ChartWrapper").then((mod) => mod.Section13ChartWrapper),
  ),
  Section14ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section14ChartWrapper").then((mod) => mod.Section14ChartWrapper),
  ),
  Section15ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section15ChartWrapper").then((mod) => mod.Section15ChartWrapper),
  ),
  Section16ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section16ChartWrapper").then((mod) => mod.Section16ChartWrapper),
  ),
  Section17ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section17ChartWrapper").then((mod) => mod.Section17ChartWrapper),
  ),
  Section18ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section18ChartWrapper").then((mod) => mod.Section18ChartWrapper),
  ),
  Section19ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section19ChartWrapper").then((mod) => mod.Section19ChartWrapper),
  ),
  Section20ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section20ChartWrapper").then((mod) => mod.Section20ChartWrapper),
  ),
  Section21ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section21ChartWrapper").then((mod) => mod.Section21ChartWrapper),
  ),
  Section22ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section22ChartWrapper").then((mod) => mod.Section22ChartWrapper),
  ),
  Section23ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section23ChartWrapper").then((mod) => mod.Section23ChartWrapper),
  ),
  Section24ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section24ChartWrapper").then((mod) => mod.Section24ChartWrapper),
  ),
  Section25ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section25ChartWrapper").then((mod) => mod.Section25ChartWrapper),
  ),
  Section26ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section26ChartWrapper").then((mod) => mod.Section26ChartWrapper),
  ),
  Section27ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section27ChartWrapper").then((mod) => mod.Section27ChartWrapper),
  ),
  Section28ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section28ChartWrapper").then((mod) => mod.Section28ChartWrapper),
  ),
  Section29ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section29ChartWrapper").then((mod) => mod.Section29ChartWrapper),
  ),
  Section30ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section30ChartWrapper").then((mod) => mod.Section30ChartWrapper),
  ),
  Section31ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section31ChartWrapper").then((mod) => mod.Section31ChartWrapper),
  ),
  Section32ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section32ChartWrapper").then((mod) => mod.Section32ChartWrapper),
  ),
  Section33ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section33ChartWrapper").then((mod) => mod.Section33ChartWrapper),
  ),
  Section34ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section34ChartWrapper").then((mod) => mod.Section34ChartWrapper),
  ),
  Section35ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section35ChartWrapper").then((mod) => mod.Section35ChartWrapper),
  ),
  Section36ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section36ChartWrapper").then((mod) => mod.Section36ChartWrapper),
  ),
  Section37ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section37ChartWrapper").then((mod) => mod.Section37ChartWrapper),
  ),
  Section38ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section38ChartWrapper").then((mod) => mod.Section38ChartWrapper),
  ),
  Section39ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section39ChartWrapper").then((mod) => mod.Section39ChartWrapper),
  ),
  Section40ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section40ChartWrapper").then((mod) => mod.Section40ChartWrapper),
  ),
  Section41ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section41ChartWrapper").then((mod) => mod.Section41ChartWrapper),
  ),
  Section42ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section42ChartWrapper").then((mod) => mod.Section42ChartWrapper),
  ),
  Section43ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section43ChartWrapper").then((mod) => mod.Section43ChartWrapper),
  ),
  Section44ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section44ChartWrapper").then((mod) => mod.Section44ChartWrapper),
  ),
  Section45ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section45ChartWrapper").then((mod) => mod.Section45ChartWrapper),
  ),
  Section46ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section46ChartWrapper").then((mod) => mod.Section46ChartWrapper),
  ),
  Section47ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section47ChartWrapper").then((mod) => mod.Section47ChartWrapper),
  ),
  Section48ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section48ChartWrapper").then((mod) => mod.Section48ChartWrapper),
  ),
  Section49ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section49ChartWrapper").then((mod) => mod.Section49ChartWrapper),
  ),
  Section50ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section50ChartWrapper").then((mod) => mod.Section50ChartWrapper),
  ),
  Section51ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section51ChartWrapper").then((mod) => mod.Section51ChartWrapper),
  ),
  Section52ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section52ChartWrapper").then((mod) => mod.Section52ChartWrapper),
  ),
  Section53ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section53ChartWrapper").then((mod) => mod.Section53ChartWrapper),
  ),
  Section54ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section54ChartWrapper").then((mod) => mod.Section54ChartWrapper),
  ),
  Section55ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section55ChartWrapper").then((mod) => mod.Section55ChartWrapper),
  ),
  Section56ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section56ChartWrapper").then((mod) => mod.Section56ChartWrapper),
  ),
  Section57ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section57ChartWrapper").then((mod) => mod.Section57ChartWrapper),
  ),
  Section58ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section58ChartWrapper").then((mod) => mod.Section58ChartWrapper),
  ),
  Section59ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section59ChartWrapper").then((mod) => mod.Section59ChartWrapper),
  ),
  Section5ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section5ChartWrapper").then((mod) => mod.Section5ChartWrapper),
  ),
  Section60ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section60ChartWrapper").then((mod) => mod.Section60ChartWrapper),
  ),
  Section61ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section61ChartWrapper").then((mod) => mod.Section61ChartWrapper),
  ),
  Section62ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section62ChartWrapper").then((mod) => mod.Section62ChartWrapper),
  ),
  Section63ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section63ChartWrapper").then((mod) => mod.Section63ChartWrapper),
  ),
  Section64ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section64ChartWrapper").then((mod) => mod.Section64ChartWrapper),
  ),
  Section65ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section65ChartWrapper").then((mod) => mod.Section65ChartWrapper),
  ),
  Section66ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section66ChartWrapper").then((mod) => mod.Section66ChartWrapper),
  ),
  Section67ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section67ChartWrapper").then((mod) => mod.Section67ChartWrapper),
  ),
  Section68ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section68ChartWrapper").then((mod) => mod.Section68ChartWrapper),
  ),
  Section69ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section69ChartWrapper").then((mod) => mod.Section69ChartWrapper),
  ),
  Section6ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section6ChartWrapper").then((mod) => mod.Section6ChartWrapper),
  ),
  Section70ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section70ChartWrapper").then((mod) => mod.Section70ChartWrapper),
  ),
  Section71ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section71ChartWrapper").then((mod) => mod.Section71ChartWrapper),
  ),
  Section72ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section72ChartWrapper").then((mod) => mod.Section72ChartWrapper),
  ),
  Section73ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section73ChartWrapper").then((mod) => mod.Section73ChartWrapper),
  ),
  Section74ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section74ChartWrapper").then((mod) => mod.Section74ChartWrapper),
  ),
  Section75ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section75ChartWrapper").then((mod) => mod.Section75ChartWrapper),
  ),
  Section7ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section7ChartWrapper").then((mod) => mod.Section7ChartWrapper),
  ),
  Section8ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section8ChartWrapper").then((mod) => mod.Section8ChartWrapper),
  ),
  Section9ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Section9ChartWrapper").then((mod) => mod.Section9ChartWrapper),
  ),
  Sheet1BarLineChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet1BarLineChartWrapper").then((mod) => mod.Sheet1BarLineChartWrapper),
  ),
  Sheet1ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet1ChartWrapper").then((mod) => mod.Sheet1ChartWrapper),
  ),
  Sheet1StackedChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet1StackedChartWrapper").then((mod) => mod.Sheet1StackedChartWrapper),
  ),
  Sheet2AmountChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet2AmountChartWrapper").then((mod) => mod.Sheet2AmountChartWrapper),
  ),
  Sheet2BarChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet2BarChartWrapper").then((mod) => mod.Sheet2BarChartWrapper),
  ),
  Sheet2ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet2ChartWrapper").then((mod) => mod.Sheet2ChartWrapper),
  ),
  Sheet3AmountChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet3AmountChartWrapper").then((mod) => mod.Sheet3AmountChartWrapper),
  ),
  Sheet3BarChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet3BarChartWrapper").then((mod) => mod.Sheet3BarChartWrapper),
  ),
  Sheet3ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet3ChartWrapper").then((mod) => mod.Sheet3ChartWrapper),
  ),
  Sheet3PieChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet3PieChartWrapper").then((mod) => mod.Sheet3PieChartWrapper),
  ),
  Sheet4AmountChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet4AmountChartWrapper").then((mod) => mod.Sheet4AmountChartWrapper),
  ),
  Sheet4BarChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet4BarChartWrapper").then((mod) => mod.Sheet4BarChartWrapper),
  ),
  Sheet4ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet4ChartWrapper").then((mod) => mod.Sheet4ChartWrapper),
  ),
  Sheet4PieChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data/Sheet4PieChartWrapper").then((mod) => mod.Sheet4PieChartWrapper),
  ),
} satisfies MDXComponents;

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
  Tab,
  Tabs,
  MdxLabel,
  MdxDateLabel,
  YouTubeEmbed,
  ChatHistory,
  ...placeholders,
};
