import dynamic from "next/dynamic";
import type { MDXComponents } from "mdx/types";

import {
  Code,
  CodeSwitcher,
  CodeWithTabs,
  CodeWithTooltips,
  HoverContainer,
  InlineCode,
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
const FinancialData = {
  Section10ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section10ChartWrapper),
  ),
  Section11ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section11ChartWrapper),
  ),
  Section12ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section12ChartWrapper),
  ),
  Section13ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section13ChartWrapper),
  ),
  Section14ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section14ChartWrapper),
  ),
  Section15ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section15ChartWrapper),
  ),
  Section16ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section16ChartWrapper),
  ),
  Section17ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section17ChartWrapper),
  ),
  Section18ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section18ChartWrapper),
  ),
  Section19ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section19ChartWrapper),
  ),
  Section20ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section20ChartWrapper),
  ),
  Section21ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section21ChartWrapper),
  ),
  Section22ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section22ChartWrapper),
  ),
  Section23ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section23ChartWrapper),
  ),
  Section24ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section24ChartWrapper),
  ),
  Section25ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section25ChartWrapper),
  ),
  Section26ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section26ChartWrapper),
  ),
  Section27ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section27ChartWrapper),
  ),
  Section28ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section28ChartWrapper),
  ),
  Section29ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section29ChartWrapper),
  ),
  Section30ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section30ChartWrapper),
  ),
  Section31ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section31ChartWrapper),
  ),
  Section32ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section32ChartWrapper),
  ),
  Section33ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section33ChartWrapper),
  ),
  Section34ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section34ChartWrapper),
  ),
  Section35ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section35ChartWrapper),
  ),
  Section36ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section36ChartWrapper),
  ),
  Section37ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section37ChartWrapper),
  ),
  Section38ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section38ChartWrapper),
  ),
  Section39ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section39ChartWrapper),
  ),
  Section40ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section40ChartWrapper),
  ),
  Section41ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section41ChartWrapper),
  ),
  Section42ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section42ChartWrapper),
  ),
  Section43ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section43ChartWrapper),
  ),
  Section44ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section44ChartWrapper),
  ),
  Section45ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section45ChartWrapper),
  ),
  Section46ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section46ChartWrapper),
  ),
  Section47ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section47ChartWrapper),
  ),
  Section48ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section48ChartWrapper),
  ),
  Section49ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section49ChartWrapper),
  ),
  Section50ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section50ChartWrapper),
  ),
  Section51ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section51ChartWrapper),
  ),
  Section52ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section52ChartWrapper),
  ),
  Section53ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section53ChartWrapper),
  ),
  Section54ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section54ChartWrapper),
  ),
  Section55ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section55ChartWrapper),
  ),
  Section56ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section56ChartWrapper),
  ),
  Section57ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section57ChartWrapper),
  ),
  Section58ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section58ChartWrapper),
  ),
  Section59ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section59ChartWrapper),
  ),
  Section5ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section5ChartWrapper),
  ),
  Section60ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section60ChartWrapper),
  ),
  Section61ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section61ChartWrapper),
  ),
  Section62ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section62ChartWrapper),
  ),
  Section63ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section63ChartWrapper),
  ),
  Section64ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section64ChartWrapper),
  ),
  Section65ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section65ChartWrapper),
  ),
  Section66ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section66ChartWrapper),
  ),
  Section67ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section67ChartWrapper),
  ),
  Section68ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section68ChartWrapper),
  ),
  Section69ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section69ChartWrapper),
  ),
  Section6ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section6ChartWrapper),
  ),
  Section70ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section70ChartWrapper),
  ),
  Section71ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section71ChartWrapper),
  ),
  Section72ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section72ChartWrapper),
  ),
  Section73ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section73ChartWrapper),
  ),
  Section74ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section74ChartWrapper),
  ),
  Section75ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section75ChartWrapper),
  ),
  Section7ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section7ChartWrapper),
  ),
  Section8ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section8ChartWrapper),
  ),
  Section9ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Section9ChartWrapper),
  ),
  Sheet1BarLineChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet1BarLineChartWrapper),
  ),
  Sheet1ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet1ChartWrapper),
  ),
  Sheet1StackedChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet1StackedChartWrapper),
  ),
  Sheet2AmountChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet2AmountChartWrapper),
  ),
  Sheet2BarChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet2BarChartWrapper),
  ),
  Sheet2ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet2ChartWrapper),
  ),
  Sheet3AmountChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet3AmountChartWrapper),
  ),
  Sheet3BarChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet3BarChartWrapper),
  ),
  Sheet3ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet3ChartWrapper),
  ),
  Sheet3PieChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet3PieChartWrapper),
  ),
  Sheet4AmountChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet4AmountChartWrapper),
  ),
  Sheet4BarChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet4BarChartWrapper),
  ),
  Sheet4ChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet4ChartWrapper),
  ),
  Sheet4PieChartWrapper: dynamic(() =>
    import("@/shared/ui/financial-data").then((mod) => mod.Sheet4PieChartWrapper),
  ),
};

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
