import { MDXRemote } from "next-mdx-remote/rsc";

import { CodeWithTabs } from "@/components/CodeHike/code-tabs";
import { Code } from "@/components/CodeHike/code";
import { InlineCode } from "@/components/CodeHike/inline-code";
import { CodeSwitcher } from "@/components/CodeHike/code-switcher";
import { CodeWithTooltips } from "@/components/CodeHike/code-with-tooltips";
import { HoverContainer, Link } from "@/components/CodeHike/code-mentions";
import { SsgImage } from "@/components/SsgImage";
import { Img } from "@/components/Mdx/Img";
import { VisDotGraph } from "@/components/VisDotGraph";
import TreeAutomatonTransition from "@/components/TreeAutomatonTransition";
import { TweetCard } from "@/components/TweetCard";

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
    
    // SsgImageで使用するbasePath
    // 例: "/assets/blog/2023-09-30-astro"
    const basePath = `/${rehypePaths.join('/')}`;

    // pathsに基づいてSsgImageをラップ
    const ImageWithBasePath = (props: any) => (
      <SsgImage
        {...props}
        basePath={basePath}
      />
    );

    // pathsに基づいてImgをラップ
    const ImgWithBasePath = (props: any) => (
      <Img
        {...props}
        basePath={basePath}
      />
    );

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
          img: ImgWithBasePath, // MDX内のimgタグをImgコンポーネントで処理
          Img: ImgWithBasePath, // MDX内の<Img>タグを処理
          a: Link,
          Code,
          InlineCode,
          CodeWithTabs,
          CodeSwitcher,
          CodeWithTooltips,
          HoverContainer,
          VisDotGraph,
          TreeAutomatonTransition,
          TweetCard,
        }}
      />
    );
  };
};

export default codeHikeComponent;
