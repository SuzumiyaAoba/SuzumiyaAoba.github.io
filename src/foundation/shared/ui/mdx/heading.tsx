import type { HTMLAttributes } from "react";

type HeadingProps = HTMLAttributes<HTMLHeadingElement>;

/**
 * 記事本文中の `# 見出し` 用。記事タイトルが h1 を占有しているため、
 * 見出しレベルの二重付与を避けるべく HTML タグは h2 として出力する。
 */
export function MdxH1({ children, ...props }: HeadingProps) {
  return <h2 {...props}>{children}</h2>;
}

export function MdxH2({ children, ...props }: HeadingProps) {
  return <h2 {...props}>{children}</h2>;
}

export function MdxH3({ children, ...props }: HeadingProps) {
  return <h3 {...props}>{children}</h3>;
}

export function MdxH4({ children, ...props }: HeadingProps) {
  return <h4 {...props}>{children}</h4>;
}

export function MdxH5({ children, ...props }: HeadingProps) {
  return <h5 {...props}>{children}</h5>;
}
