import { AnnotationHandler, InnerLine } from "codehike/code";
import NextLink from "next/link";
import React from "react";

export function HoverContainer(props: { children: React.ReactNode }) {
  return <div className="hover-container">{props.children}</div>;
}

export const hover: AnnotationHandler = {
  name: "hover",
  onlyIfAnnotated: true,
  Line: ({ annotation, ...props }) => (
    <InnerLine
      merge={props}
      className="transition-opacity"
      data-line={annotation?.query || ""}
    />
  ),
};

export function Link(props: { href?: string; children?: React.ReactNode }) {
  if (props.href?.startsWith("hover:")) {
    const hover = props.href.slice("hover:".length);
    return (
      <span
        className="underline decoration-dotted underline-offset-4"
        data-hover={hover}
      >
        {props.children}
      </span>
    );
  } else if (props.href) {
    // 外部リンクの場合は<a>タグを使用
    if (props.href.startsWith("http") || props.href.startsWith("mailto:")) {
      return <a href={props.href} target="_blank" rel="noopener noreferrer" {...props} />;
    } else {
      // 内部リンク（アンカーリンク含む）の場合はNext.jsのLinkを使用
      // 新しいLinkコンポーネントの仕様に準拠
      const { children, ...linkProps } = props;
      // childrenを文字列として抽出
      const textContent = typeof children === 'string' ? children : 
        React.Children.toArray(children).map(child => 
          typeof child === 'string' ? child : 
          React.isValidElement(child) ? child.props.children : child
        ).join('');
      return <NextLink href={props.href} {...linkProps}>{textContent}</NextLink>;
    }
  } else {
    return <span {...props} />;
  }
}
