import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import remarkJoinCjkLines from "remark-join-cjk-lines";
import { remarkMermaid } from "@theguild/remark-mermaid";
import { Mermaid } from "@theguild/remark-mermaid/mermaid";
import type { Plugin } from "unified";

import rehypeImageSize from "../rehype/rehype-image-size";
import rehypeResolveImageUrls from "../rehype/rehype-resolve-image-urls";
import { rehypeTwitterUrls } from "../rehype/rehype-twitter-urls";
import { rehypeYoutubeUrls } from "../rehype/rehype-youtube-urls";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeExternalLinks from "rehype-external-links";
import { SsgImage } from "@/components/SsgImage";
import { Img } from "@/components/Mdx/Img";
import { GitHubCodeLink } from "@/components/Mdx/GitHubCodeLink";
import { Message } from "@/components/Mdx/Message";
import { DependencyInjectionPrinciplesPracticesAndPatterns } from "@/components/Ads/rakuten/ads/DependencyInjectionPrinciplesPracticesAndPatterns";
import { TableWrapper } from "@/components/TableWrapper";
import { VisDotGraph } from "@/components/VisDotGraph";
import { TweetCard } from "@/components/TweetCard";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { ChatHistory } from "@/components/ChatHistory";
import { Sheet1Chart } from "@/components/FinancialDataVisualization/Sheet1Chart";
import { Sheet1ChartWrapper } from "@/components/FinancialDataVisualization/Sheet1ChartWrapper";
import { Sheet1StackedChart } from "@/components/FinancialDataVisualization/Sheet1StackedChart";
import { Sheet1StackedChartWrapper } from "@/components/FinancialDataVisualization/Sheet1StackedChartWrapper";
import { Sheet1BarLineChart } from "@/components/FinancialDataVisualization/Sheet1BarLineChart";
import { Sheet1BarLineChartWrapper } from "@/components/FinancialDataVisualization/Sheet1BarLineChartWrapper";
import { Sheet2ChartWrapper } from "@/components/FinancialDataVisualization/Sheet2ChartWrapper";
import { Sheet2BarChartWrapper } from "@/components/FinancialDataVisualization/Sheet2BarChartWrapper";
import { Sheet2AmountChartWrapper } from "@/components/FinancialDataVisualization/Sheet2AmountChartWrapper";
import { Sheet3ChartWrapper } from "@/components/FinancialDataVisualization/Sheet3ChartWrapper";
import { Sheet3BarChartWrapper } from "@/components/FinancialDataVisualization/Sheet3BarChartWrapper";
import { Sheet3AmountChartWrapper } from "@/components/FinancialDataVisualization/Sheet3AmountChartWrapper";
import { Sheet3PieChartWrapper } from "@/components/FinancialDataVisualization/Sheet3PieChartWrapper";
import { Sheet4ChartWrapper } from "@/components/FinancialDataVisualization/Sheet4ChartWrapper";
import { Sheet4BarChartWrapper } from "@/components/FinancialDataVisualization/Sheet4BarChartWrapper";
import { Sheet4AmountChartWrapper } from "@/components/FinancialDataVisualization/Sheet4AmountChartWrapper";
import { Sheet4PieChartWrapper } from "@/components/FinancialDataVisualization/Sheet4PieChartWrapper";
import { Section5ChartWrapper } from "@/components/FinancialDataVisualization/Section5ChartWrapper";
import { Section6ChartWrapper } from "@/components/FinancialDataVisualization/Section6ChartWrapper";
import { Section7ChartWrapper } from "@/components/FinancialDataVisualization/Section7ChartWrapper";
import { Section8ChartWrapper } from "@/components/FinancialDataVisualization/Section8ChartWrapper";
import { Section9ChartWrapper } from "@/components/FinancialDataVisualization/Section9ChartWrapper";
import { Section10ChartWrapper } from "@/components/FinancialDataVisualization/Section10ChartWrapper";
import { Section11ChartWrapper } from "@/components/FinancialDataVisualization/Section11ChartWrapper";
import { Section12ChartWrapper } from "@/components/FinancialDataVisualization/Section12ChartWrapper";
import { Section13ChartWrapper } from "@/components/FinancialDataVisualization/Section13ChartWrapper";
import { Section14ChartWrapper } from "@/components/FinancialDataVisualization/Section14ChartWrapper";
import { Section15ChartWrapper } from "@/components/FinancialDataVisualization/Section15ChartWrapper";
import { Section16ChartWrapper } from "@/components/FinancialDataVisualization/Section16ChartWrapper";
import { Section17ChartWrapper } from "@/components/FinancialDataVisualization/Section17ChartWrapper";
import { Section18ChartWrapper } from "@/components/FinancialDataVisualization/Section18ChartWrapper";
import { Section19ChartWrapper } from "@/components/FinancialDataVisualization/Section19ChartWrapper";
import { Section20ChartWrapper } from "@/components/FinancialDataVisualization/Section20ChartWrapper";
import { Section21ChartWrapper } from "@/components/FinancialDataVisualization/Section21ChartWrapper";
import { Section22ChartWrapper } from "@/components/FinancialDataVisualization/Section22ChartWrapper";
import { Section23ChartWrapper } from "@/components/FinancialDataVisualization/Section23ChartWrapper";
import { Section24ChartWrapper } from "@/components/FinancialDataVisualization/Section24ChartWrapper";
import { Section25ChartWrapper } from "@/components/FinancialDataVisualization/Section25ChartWrapper";
import { Section26ChartWrapper } from "@/components/FinancialDataVisualization/Section26ChartWrapper";
import { Section27ChartWrapper } from "@/components/FinancialDataVisualization/Section27ChartWrapper";
import { Section28ChartWrapper } from "@/components/FinancialDataVisualization/Section28ChartWrapper";
import { Section29ChartWrapper } from "@/components/FinancialDataVisualization/Section29ChartWrapper";
import { Section30ChartWrapper } from "@/components/FinancialDataVisualization/Section30ChartWrapper";
import { Section31ChartWrapper } from "@/components/FinancialDataVisualization/Section31ChartWrapper";
import { Section32ChartWrapper } from "@/components/FinancialDataVisualization/Section32ChartWrapper";
import { Section33ChartWrapper } from "@/components/FinancialDataVisualization/Section33ChartWrapper";
import { Section34ChartWrapper } from "@/components/FinancialDataVisualization/Section34ChartWrapper";
import { Section35ChartWrapper } from "@/components/FinancialDataVisualization/Section35ChartWrapper";
import { Section36ChartWrapper } from "@/components/FinancialDataVisualization/Section36ChartWrapper";
import { Section37ChartWrapper } from "@/components/FinancialDataVisualization/Section37ChartWrapper";
import { Section38ChartWrapper } from "@/components/FinancialDataVisualization/Section38ChartWrapper";
import { Section39ChartWrapper } from "@/components/FinancialDataVisualization/Section39ChartWrapper";
import { Section40ChartWrapper } from "@/components/FinancialDataVisualization/Section40ChartWrapper";
import { Section41ChartWrapper } from "@/components/FinancialDataVisualization/Section41ChartWrapper";
import { Section42ChartWrapper } from "@/components/FinancialDataVisualization/Section42ChartWrapper";
import { Section43ChartWrapper } from "@/components/FinancialDataVisualization/Section43ChartWrapper";
import { Section44ChartWrapper } from "@/components/FinancialDataVisualization/Section44ChartWrapper";
import { Section45ChartWrapper } from "@/components/FinancialDataVisualization/Section45ChartWrapper";
import { Section46ChartWrapper } from "@/components/FinancialDataVisualization/Section46ChartWrapper";
import { Section47ChartWrapper } from "@/components/FinancialDataVisualization/Section47ChartWrapper";
import { Section48ChartWrapper } from "@/components/FinancialDataVisualization/Section48ChartWrapper";
import { Section49ChartWrapper } from "@/components/FinancialDataVisualization/Section49ChartWrapper";
import { Section50ChartWrapper } from "@/components/FinancialDataVisualization/Section50ChartWrapper";
import { Section51ChartWrapper } from "@/components/FinancialDataVisualization/Section51ChartWrapper";
import { Section52ChartWrapper } from "@/components/FinancialDataVisualization/Section52ChartWrapper";
import { Section53ChartWrapper } from "@/components/FinancialDataVisualization/Section53ChartWrapper";
import { Section54ChartWrapper } from "@/components/FinancialDataVisualization/Section54ChartWrapper";
import { Section55ChartWrapper } from "@/components/FinancialDataVisualization/Section55ChartWrapper";
import { Section56ChartWrapper } from "@/components/FinancialDataVisualization/Section56ChartWrapper";
import { Section57ChartWrapper } from "@/components/FinancialDataVisualization/Section57ChartWrapper";
import { Section58ChartWrapper } from "@/components/FinancialDataVisualization/Section58ChartWrapper";
import { Section59ChartWrapper } from "@/components/FinancialDataVisualization/Section59ChartWrapper";
import { Section60ChartWrapper } from "@/components/FinancialDataVisualization/Section60ChartWrapper";
import { Section61ChartWrapper } from "@/components/FinancialDataVisualization/Section61ChartWrapper";
import { Section62ChartWrapper } from "@/components/FinancialDataVisualization/Section62ChartWrapper";
import { Section63ChartWrapper } from "@/components/FinancialDataVisualization/Section63ChartWrapper";
import { Section64ChartWrapper } from "@/components/FinancialDataVisualization/Section64ChartWrapper";
import { Section65ChartWrapper } from "@/components/FinancialDataVisualization/Section65ChartWrapper";
import { Section66ChartWrapper } from "@/components/FinancialDataVisualization/Section66ChartWrapper";
import { Section67ChartWrapper } from "@/components/FinancialDataVisualization/Section67ChartWrapper";
import { Section68ChartWrapper } from "@/components/FinancialDataVisualization/Section68ChartWrapper";
import { Section69ChartWrapper } from "@/components/FinancialDataVisualization/Section69ChartWrapper";
import { Section70ChartWrapper } from "@/components/FinancialDataVisualization/Section70ChartWrapper";
import { Section71ChartWrapper } from "@/components/FinancialDataVisualization/Section71ChartWrapper";
import { Section72ChartWrapper } from "@/components/FinancialDataVisualization/Section72ChartWrapper";
import { Section73ChartWrapper } from "@/components/FinancialDataVisualization/Section73ChartWrapper";
import { Section74ChartWrapper } from "@/components/FinancialDataVisualization/Section74ChartWrapper";
import { Section75ChartWrapper } from "@/components/FinancialDataVisualization/Section75ChartWrapper";
import { Tabs, Tab } from "@/components/Tabs";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

type Pluggable = Plugin<any[], any> | [Plugin<any[], any>, unknown?];
type PluggableList = Pluggable[];

export const defaultRemarkPlugins: PluggableList = [
  remarkGfm,
  remarkEmoji,
  remarkJoinCjkLines,
  remarkMath,
  remarkMermaid,
];

export const defaultRehypePlugins = (...paths: string[]): PluggableList => [
  rehypeResolveImageUrls,
  rehypeTwitterUrls,
  rehypeYoutubeUrls,
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: "wrap" }],
  [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
  [
    rehypeKatex,
    {
      output: "mathml",
      throwOnError: false,
      errorColor: "#cc0000",
      trust: true,
    },
  ],
];

export const defaultComponents = {
  img: SsgImage,
  Img,
  GitHubCodeLink,
  Message,
  Mermaid,
  DependencyInjectionPrinciplesPracticesAndPatterns,
  table: TableWrapper,
  VisDotGraph,
  TweetCard,
  YouTubeEmbed,
  ChatHistory,
  Sheet1Chart,
  Sheet1ChartWrapper,
  Sheet1StackedChart,
  Sheet1StackedChartWrapper,
  Sheet1BarLineChart,
  Sheet1BarLineChartWrapper,
  Sheet2ChartWrapper,
  Sheet2BarChartWrapper,
  Sheet2AmountChartWrapper,
  Sheet3ChartWrapper,
  Sheet3BarChartWrapper,
  Sheet3AmountChartWrapper,
  Sheet3PieChartWrapper,
  Sheet4ChartWrapper,
  Sheet4BarChartWrapper,
  Sheet4AmountChartWrapper,
  Sheet4PieChartWrapper,
  Section5ChartWrapper,
  Section6ChartWrapper,
  Section7ChartWrapper,
  Section8ChartWrapper,
  Section9ChartWrapper,
  Section10ChartWrapper,
  Section11ChartWrapper,
  Section12ChartWrapper,
  Section13ChartWrapper,
  Section14ChartWrapper,
  Section15ChartWrapper,
  Section16ChartWrapper,
  Section17ChartWrapper,
  Section18ChartWrapper,
  Section19ChartWrapper,
  Section20ChartWrapper,
  Section21ChartWrapper,
  Section22ChartWrapper,
  Section23ChartWrapper,
  Section24ChartWrapper,
  Section25ChartWrapper,
  Section26ChartWrapper,
  Section27ChartWrapper,
  Section28ChartWrapper,
  Section29ChartWrapper,
  Section30ChartWrapper,
  Section31ChartWrapper,
  Section32ChartWrapper,
  Section33ChartWrapper,
  Section34ChartWrapper,
  Section35ChartWrapper,
  Section36ChartWrapper,
  Section37ChartWrapper,
  Section38ChartWrapper,
  Section39ChartWrapper,
  Section40ChartWrapper,
  Section41ChartWrapper,
  Section42ChartWrapper,
  Section43ChartWrapper,
  Section44ChartWrapper,
  Section45ChartWrapper,
  Section46ChartWrapper,
  Section47ChartWrapper,
  Section48ChartWrapper,
  Section49ChartWrapper,
  Section50ChartWrapper,
  Section51ChartWrapper,
  Section52ChartWrapper,
  Section53ChartWrapper,
  Section54ChartWrapper,
  Section55ChartWrapper,
  Section56ChartWrapper,
  Section57ChartWrapper,
  Section58ChartWrapper,
  Section59ChartWrapper,
  Section60ChartWrapper,
  Section61ChartWrapper,
  Section62ChartWrapper,
  Section63ChartWrapper,
  Section64ChartWrapper,
  Section65ChartWrapper,
  Section66ChartWrapper,
  Section67ChartWrapper,
  Section68ChartWrapper,
  Section69ChartWrapper,
  Section70ChartWrapper,
  Section71ChartWrapper,
  Section72ChartWrapper,
  Section73ChartWrapper,
  Section74ChartWrapper,
  Section75ChartWrapper,
  Tabs,
  Tab,
};
