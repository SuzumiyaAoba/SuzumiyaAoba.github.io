import type { ComponentProps } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import type { CodeHikeConfig } from "codehike/mdx";
import { recmaCodeHike, remarkCodeHike } from "codehike/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkJoinCjkLines from "remark-join-cjk-lines";
import remarkMath from "remark-math";

import { mdxComponents } from "@/shared/lib/mdx/components";
import { Img } from "@/shared/ui/mdx/img";

function remarkMermaid() {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node || !Array.isArray(node.children)) {
        return;
      }

      node.children = node.children.map((child: any) => {
        if (child?.type === "code" && child.lang === "mermaid") {
          return {
            type: "mdxJsxFlowElement",
            name: "Mermaid",
            attributes: [
              {
                type: "mdxJsxAttribute",
                name: "code",
                value: child.value,
              },
            ],
            children: [],
          };
        }

        return child;
      });

      node.children.forEach(visit);
    };

    visit(tree);
  };
}

export async function renderMdx(
  source: string,
  { basePath, scope }: { basePath?: string; scope?: Record<string, unknown> } = {},
) {
  const codeHikeConfig: CodeHikeConfig = {
    components: { code: "Code", inlineCode: "InlineCode" },
    syntaxHighlighting: { theme: "github-light" },
  };

  const components = basePath
    ? {
        ...mdxComponents,
        Img: (props: ComponentProps<typeof Img>) => <Img {...props} basePath={basePath} />,
        img: (props: ComponentProps<typeof Img>) => <Img {...props} basePath={basePath} />,
      }
    : mdxComponents;

  const { content } = await compileMDX({
    source,
    components,
    options: {
      ...(scope ? { scope } : {}),
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          remarkEmoji,
          remarkJoinCjkLines,
          remarkMath,
          remarkMermaid,
          [remarkCodeHike, codeHikeConfig],
        ],
        recmaPlugins: [[recmaCodeHike, codeHikeConfig]],
        rehypePlugins: [
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
        ],
      },
    },
  });

  return <>{content}</>;
}
