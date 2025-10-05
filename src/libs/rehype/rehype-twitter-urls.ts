import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

const TWITTER_URL_REGEX =
  /^https?:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/;

export function rehypeTwitterUrls() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "a") return;

      const href = node.properties?.href;
      if (typeof href !== "string") return;

      const match = href.match(TWITTER_URL_REGEX);
      if (!match) return;

      const tweetId = match[2];

      // Only convert standalone URLs in paragraphs
      if (
        parent?.type === "element" &&
        parent?.tagName === "p" &&
        parent.children.length === 1 &&
        typeof index === "number"
      ) {
        // Transform paragraph to TweetCard component
        parent.tagName = "TweetCard";
        parent.properties = { id: tweetId };
        parent.children = [];
      }
    });
  };
}
