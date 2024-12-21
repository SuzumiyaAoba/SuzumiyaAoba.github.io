import { MDXRemote } from "next-mdx-remote/rsc";
import { FC } from "react";

import { CodeWithTabs } from "@/components/CodeHike/code-tabs";
import { Code } from "@/components/CodeHike/code";
import { CodeSwitcher } from "@/components/CodeHike/code-switcher";
import { Link, HoverContainer } from "@/components/CodeHike/code-mentions";

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
  paths,
  format,
  data,
  content,
}: {
  paths: string[];
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
          rehypePlugins: [...defaultRehypePlugins(...paths)],
          recmaPlugins: [[recmaCodeHike, chConfig]],
        },
        scope: data,
      }}
      components={{
        ...defaultComponents,
        a: Link,
        Code,
        CodeWithTabs,
        CodeSwitcher,
        HoverContainer,
      }}
    />
  );
};
