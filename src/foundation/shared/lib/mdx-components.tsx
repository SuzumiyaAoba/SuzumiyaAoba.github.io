import type { MDXComponents } from "mdx/types";

/**
 * MDX コンポーネントのデフォルト定義
 */
const components: MDXComponents = {};

/**
 * MDX コンポーネントを解決するためのカスタムフック。
 * Next.js の `app` ディレクトリ外での MDX レンダリング時に使用されます。
 * @returns MDX コンポーネントの定義オブジェクト
 */
export function useMDXComponents(): MDXComponents {
  return components;
}
