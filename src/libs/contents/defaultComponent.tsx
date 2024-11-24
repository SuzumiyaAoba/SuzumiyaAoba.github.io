import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// @ts-ignore
import remarkJoinCjkLines from "remark-join-cjk-lines";
import rehypePrettyCode from "rehype-pretty-code";
import { FC } from "react";
import rehypeImageSize from "../rehype/rehype-image-size";
import { SsgImage } from "@/components/SsgImage";
import rehypeExternalLinks from "rehype-external-links";
import { GitHubCodeLink } from "@/components/Mdx/GitHubCodeLink";
import { Message } from "@/components/Mdx/Message";
import rehypeSlug from "rehype-slug";
import { PageKey } from ".";

export default ({
  key,
  slug,
  format,
  data,
  content,
}: {
  key: PageKey;
  slug: string;
  format: "md" | "mdx";
  data: { [key: string]: any };
  content: string;
}): FC<unknown> => {
  return () => (
    <MDXRemote
      source={content}
      options={{
        mdxOptions: {
          format,
          remarkPlugins: [
            remarkGfm,
            remarkEmoji,
            remarkJoinCjkLines,
            remarkMath,
          ],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeExternalLinks,
              { target: "_blank", rel: ["noopener", "noreferrer"] },
            ],
            rehypeImageSize(key, slug),
            rehypeKatex,
            [
              rehypePrettyCode,
              {
                defaultLang: {
                  block: "plaintext",
                  inline: "plaintext",
                },
                theme: "github-light",
                keepBackground: false,
              },
            ],
          ],
        },
        scope: data,
      }}
      components={{
        img: (props) => <SsgImage {...props} />,
        GitHubCodeLink: (props) => <GitHubCodeLink {...props} />,
        Message: (props) => <Message {...props} />,
      }}
    />
  );
};
