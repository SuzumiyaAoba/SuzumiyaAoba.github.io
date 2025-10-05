import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

const YOUTUBE_URL_REGEX =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

export function rehypeYoutubeUrls() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "a") return;

      const href = node.properties?.href;
      if (typeof href !== "string") return;

      const match = href.match(YOUTUBE_URL_REGEX);
      if (!match) return;

      const videoId = match[1];

      // 親がpタグで、pタグの唯一の子要素の場合のみ変換
      if (
        parent?.type === "element" &&
        parent?.tagName === "p" &&
        parent.children.length === 1 &&
        typeof index === "number"
      ) {
        parent.tagName = "YouTubeEmbed";
        parent.properties = { id: videoId };
        parent.children = [];
      }
    });
  };
}
