import type { MDXComponents } from "mdx/types";

import {
  Code,
  CodeSwitcher,
  CodeWithTabs,
  CodeWithTooltips,
  HoverContainer,
  InlineCode,
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

const placeholders = Object.fromEntries(
  placeholderNames.map((name) => [name, createPlaceholder(name)]),
);

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
  YouTubeEmbed,
  ChatHistory,
  ...FinancialData,
  ...placeholders,
};
