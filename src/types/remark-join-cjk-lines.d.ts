declare module "remark-join-cjk-lines" {
  import type { Root } from "mdast";
  import type { Plugin } from "unified";

  const remarkJoinCjkLines: Plugin<[], Root>;
  export default remarkJoinCjkLines;
}
