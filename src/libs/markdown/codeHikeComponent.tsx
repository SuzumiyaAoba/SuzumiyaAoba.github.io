import { MDXRemote } from "next-mdx-remote/rsc";

import { CodeWithTabs } from "@/components/CodeHike/code-tabs";
import { Code } from "@/components/CodeHike/code";
import { InlineCode } from "@/components/CodeHike/inline-code";
import { CodeSwitcher } from "@/components/CodeHike/code-switcher";
import { CodeWithTooltips } from "@/components/CodeHike/code-with-tooltips";
import { HoverContainer, Link } from "@/components/CodeHike/code-mentions";

import type { CodeHikeConfig } from "codehike/mdx";
import { recmaCodeHike, remarkCodeHike } from "codehike/mdx";
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

/**
 * MDXコンテンツをレンダリングするためのコンポーネントを生成する
 * @param paths コンテンツのパス（例: ["blog", "2023-09-30-astro"]）
 * @param format フォーマット（"md" or "mdx"）
 * @param scope スコープ
 * @param source ソースコード
 * @returns MDXコンポーネント
 */
const codeHikeComponent: MDXComponent = ({ paths, format, scope, source }) => {
  return function mdXRemote() {
    // rehype-image-sizeに渡すパス
    // このパスがpublicディレクトリの中での画像ファイルの場所を指定する
    // 例: ["assets", "blog", "2023-09-30-astro"]
    const rehypePaths = ["assets", ...paths];

    return (
      <MDXRemote
        source={source}
        options={{
          mdxOptions: {
            format,
            remarkPlugins: [
              ...defaultRemarkPlugins,
              [remarkCodeHike, chConfig],
            ],
            rehypePlugins: [...defaultRehypePlugins(...rehypePaths)],
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
          CodeWithTooltips,
          HoverContainer,
        }}
      />
    );
  };
};

export default codeHikeComponent;
