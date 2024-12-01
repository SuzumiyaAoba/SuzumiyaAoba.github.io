import { MDXRemote } from "next-mdx-remote/rsc";
import { FC } from "react";
import { PageKey } from ".";

import { CodeWithTabs } from "@/components/CodeHike/code-tabs";
import { Code } from "@/components/CodeHike/code";

import type { CodeHikeConfig } from "codehike/mdx";
import { remarkCodeHike, recmaCodeHike } from "codehike/mdx";
import {
  defaultComponents,
  defaultRehypePlugins,
  defaultRemarkPlugins,
} from "./mdxOptions";

const chConfig: CodeHikeConfig = {
  components: { code: "Code" },
};

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
          remarkPlugins: [...defaultRemarkPlugins, [remarkCodeHike, chConfig]],
          rehypePlugins: [...defaultRehypePlugins(key, slug)],
          recmaPlugins: [[recmaCodeHike, chConfig]],
        },
        scope: data,
      }}
      components={{
        ...defaultComponents,
        Code,
        CodeWithTabs,
      }}
    />
  );
};
