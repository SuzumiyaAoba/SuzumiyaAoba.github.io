import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
// @ts-ignore
import remarkJoinCjkLines from "remark-join-cjk-lines";
import { remarkMermaid } from "@theguild/remark-mermaid";
import { Mermaid } from "@theguild/remark-mermaid/mermaid";

import rehypeImageSize from "../rehype/rehype-image-size";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeExternalLinks from "rehype-external-links";
import { SsgImage } from "@/components/SsgImage";
import { GitHubCodeLink } from "@/components/Mdx/GitHubCodeLink";
import { Message } from "@/components/Mdx/Message";
import { DependecyInjectionPriciplesPractilcesAndPatterns } from "@/components/Ads/rakuten/ads/DpendencyInjectionPrinciplesPracticesAndPatterns";
import { TableWrapper } from "@/components/TableWrapper";

export const defaultRemarkPlugins: any[] = [
  remarkGfm,
  remarkEmoji,
  remarkJoinCjkLines,
  remarkMath,
  remarkMermaid,
];

export const defaultRehypePlugins = (...paths: string[]): any[] => [
  rehypeSlug,
  [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
  rehypeImageSize(...paths),
  rehypeKatex,
];

export const defaultComponents = {
  img: SsgImage,
  GitHubCodeLink,
  Message,
  Mermaid,
  DependecyInjectionPriciplesPractilcesAndPatterns,
  table: TableWrapper,
};
