import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { FC } from "react";
import {
  defaultComponents,
  defaultRehypePlugins,
  defaultRemarkPlugins,
} from "./mdxOptions";

export default ({
  assetsBasePath,
  slug,
  format,
  data,
  content,
}: {
  assetsBasePath: string;
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
          remarkPlugins: [...defaultRemarkPlugins],
          rehypePlugins: [
            ...defaultRehypePlugins(assetsBasePath, slug),
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
        ...defaultComponents,
      }}
    />
  );
};
