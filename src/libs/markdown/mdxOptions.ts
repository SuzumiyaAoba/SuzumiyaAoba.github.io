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
};
