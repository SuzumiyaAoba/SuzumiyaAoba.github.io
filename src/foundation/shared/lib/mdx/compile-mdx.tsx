import { compile, run } from "@mdx-js/mdx";
import type { CompileOptions } from "@mdx-js/mdx";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import type { MDXComponents } from "mdx/types";
import type { Root } from "mdast";

function removeScopeImports() {
  return (tree: Root) => {
    tree.children = tree.children.filter((node) => node.type !== "mdxjsEsm");
  };
}

export async function compileMDX({
  source,
  components = {},
  options,
}: {
  source: string;
  components?: MDXComponents;
  options?: { scope?: Record<string, unknown>; mdxOptions?: CompileOptions };
}) {
  // MDX の import は既存の scope ローダーで解決済み。コードフェンス内の import はそのまま保持する。
  const compiled = await compile(source, {
    ...options?.mdxOptions,
    remarkPlugins: [
      removeScopeImports,
      ...(options?.mdxOptions?.remarkPlugins ?? []),
    ],
    outputFormat: "function-body",
    development: false,
  });
  const names = Object.keys(options?.scope ?? {});
  const prefix = names.length
    ? `const { ${names.join(",")} } = arguments[0];\n`
    : "";
  const { default: Content } = await run(prefix + String(compiled), {
    Fragment,
    jsx,
    jsxs,
    ...options?.scope,
  });
  return { content: <Content components={components} /> };
}
