import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  defaultRemarkPlugins,
  defaultRehypePlugins,
} from "../markdown/mdxOptions";

/**
 * Unified プロセッサーを作成する
 * プラグインの適用ロジックを共通化
 */
export function createProcessor(options: {
  basePath: string;
  includeStringify?: boolean;
}) {
  const processor = unified().use(remarkParse).use(remarkMdx);

  // Remark プラグインを適用
  defaultRemarkPlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      processor.use(plugin[0], plugin[1]);
    } else {
      processor.use(plugin);
    }
  });

  // Rehype に変換
  processor.use(remarkRehype);

  // Rehype プラグインを適用
  const rehypePlugins = defaultRehypePlugins(options.basePath);
  rehypePlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      processor.use(plugin[0], plugin[1]);
    } else {
      processor.use(plugin);
    }
  });

  // オプションで stringify を追加
  if (options.includeStringify) {
    processor.use(rehypeStringify);
  }

  return processor;
}
