import { compileMDX, MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// @ts-ignore
import remarkJoinCjkLines from "remark-join-cjk-lines";
import { FC } from "react";
import rehypeImageSize from "../rehype/rehype-image-size";
import { SsgImage } from "@/components/SsgImage";
import rehypeExternalLinks from "rehype-external-links";
import { GitHubCodeLink } from "@/components/Mdx/GitHubCodeLink";
import { Message } from "@/components/Mdx/Message";
import rehypeSlug from "rehype-slug";
import { PageKey } from ".";

import { highlight, Pre, RawCode } from "codehike/code";
import type { CodeHikeConfig } from "codehike/mdx";
import { remarkCodeHike, recmaCodeHike } from "codehike/mdx";

///

import { Block, CodeBlock, parseProps } from "codehike/blocks";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Schema = Block.extend({ tabs: z.array(CodeBlock) });
async function CodeWithTabs(props: unknown) {
  const { tabs } = parseProps(props, Schema);
  return <CodeTabs tabs={tabs} />;
}

export async function CodeTabs(props: { tabs: RawCode[] }) {
  const { tabs } = props;
  const highlighted = await Promise.all(
    tabs.map((tab) => highlight(tab, "github-light"))
  );
  return (
    <Tabs defaultValue={tabs[0]?.meta}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.meta} value={tab.meta}>
            {tab.meta}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, i) => (
        <TabsContent key={tab.meta} value={tab.meta}>
          <Pre code={highlighted[i]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
///

const chConfig: CodeHikeConfig = {
  components: { code: "Code" },
};

async function Code({ codeblock }: { codeblock: RawCode }) {
  const highlighted = await highlight(codeblock, "github-light");
  return (
    <div className="code-hike codeblock">
      <div>{highlighted.meta}</div>
      <Pre code={highlighted} />
    </div>
  );
}

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
            [remarkCodeHike, chConfig],
          ],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeExternalLinks,
              { target: "_blank", rel: ["noopener", "noreferrer"] },
            ],
            rehypeImageSize(key, slug),
            rehypeKatex,
          ],
          recmaPlugins: [[recmaCodeHike, chConfig]],
        },
        scope: data,
      }}
      components={{
        img: (props) => <SsgImage {...props} />,
        GitHubCodeLink: (props) => <GitHubCodeLink {...props} />,
        Message: (props) => <Message {...props} />,
        Code,
        CodeWithTabs,
      }}
    />
  );
};
