import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
// @ts-ignore
import remarkJoinCjkLines from "remark-join-cjk-lines";

import rehypeImageSize from "../rehype/rehype-image-size";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeExternalLinks from "rehype-external-links";
import { PageKey } from ".";
import { SsgImage } from "@/components/SsgImage";
import { GitHubCodeLink } from "@/components/Mdx/GitHubCodeLink";
import { Message } from "@/components/Mdx/Message";

export const defaultRemarkPlugins: any[] = [
  remarkGfm,
  remarkEmoji,
  remarkJoinCjkLines,
  remarkMath,
];

export const defaultRehypePlugins: (key: PageKey, slug: string) => any[] = (
  key,
  slug
) => [
  rehypeSlug,
  [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
  rehypeImageSize(key, slug),
  rehypeKatex,
];

export const defaultComponents = {
  img: SsgImage,
  GitHubCodeLink,
  Message,
};
