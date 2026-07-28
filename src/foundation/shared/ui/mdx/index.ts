/**
 * MDX コンテンツで使用するための基本的な UI コンポーネント群をエクスポートする。
 */

// CodeSwitcher / CodeWithTabs / CodeWithTooltips はここから再エクスポートしない。
// これらは codehike の highlight（Shiki + TextMate 文法、約 256KB gzip）を
// 静的 import しており、バレルに載せると全 MDX ページへ引き込まれる。
// 使用する記事だけが render-mdx.tsx 経由で code-blocks-lazy から読み込む。
export { Code } from "./code";
export { InlineCode } from "./inline-code";

// Mermaid はここから再エクスポートしない。
// mermaid.tsx は mermaid 本体を静的 import しており、このバレルに載せると
// バレルを使う全ての MDX ページのバンドルへ mermaid + d3（390KB gzip 超）が
// 引き込まれてしまう。図を含む記事だけが render-mdx.tsx 経由で読み込む。
export { Tab } from "./tab";
export { Tabs } from "./tabs";
export { MdxLabel } from "./label";
export { MdxDateLabel } from "./date-label";
export { AmazonAssociate } from "@/shared/ui/amazon";
export { AmazonProductSection } from "./amazon-product-section";
export { TwitterWidgets } from "./twitter-widgets";

export { HoverContainer, MdxLink } from "./codehike-mentions";
export { Message } from "./message";
export { Column } from "./column";
