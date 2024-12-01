import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { FC } from "react";
import { PageKey } from ".";
import {
  defaultComponents,
  defaultRehypePlugins,
  defaultRemarkPlugins,
} from "./mdxOptions";

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
          remarkPlugins: [...defaultRemarkPlugins],
          rehypePlugins: [
            ...defaultRehypePlugins(key, slug),
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
