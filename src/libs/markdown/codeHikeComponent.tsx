import { MDXRemote } from "next-mdx-remote/rsc";

import { CodeWithTabs } from "@/components/CodeHike/code-tabs";
import { Code } from "@/components/CodeHike/code";
import { InlineCode } from "@/components/CodeHike/inline-code";
import { CodeSwitcher } from "@/components/CodeHike/code-switcher";
import { Link, HoverContainer } from "@/components/CodeHike/code-mentions";

import type { CodeHikeConfig } from "codehike/mdx";
import { remarkCodeHike, recmaCodeHike } from "codehike/mdx";
import {
  defaultComponents,
  defaultRehypePlugins,
  defaultRemarkPlugins,
} from "./mdxOptions";
import type { MDXComponent } from "./MDXComponent";

const chConfig: CodeHikeConfig = {
  components: {
    code: "Code",
    inlineCode: "InlineCode",
  },
};

const codeHikeComponent: MDXComponent = ({ paths, format, scope, source }) => {
  return () => (
    <MDXRemote
      source={source}
      options={{
        mdxOptions: {
          format,
          remarkPlugins: [...defaultRemarkPlugins, [remarkCodeHike, chConfig]],
          rehypePlugins: [...defaultRehypePlugins("assets", ...paths)],
          recmaPlugins: [[recmaCodeHike, chConfig]],
        },
        scope,
      }}
      components={{
        ...defaultComponents,
        a: Link,
        Code,
        InlineCode,
        CodeWithTabs,
        CodeSwitcher,
        HoverContainer,
      }}
    />
  );
};

export default codeHikeComponent;
