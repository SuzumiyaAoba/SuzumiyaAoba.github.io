import {
  ArticleOpengraphImage,
  OpengraphTags,
  renderOpengraphImage,
} from "./opengraph-image";

export { OPENGRAPH_IMAGE_SIZE as CONTENT_OPENGRAPH_IMAGE_SIZE } from "./opengraph-image";

export type RenderContentOpengraphImageOptions = {
  /** 種別ラベル(例: "Notes", "Series", "Tag", "Book") */
  eyebrow: string;
  title: string;
  tags?: string[];
};

/** notes/series/tags/books 詳細ページ共通の OGP 画像を描画する。 */
export async function renderContentOpengraphImage({
  eyebrow,
  title,
  tags = [],
}: RenderContentOpengraphImageOptions) {
  return await renderOpengraphImage(
    <ArticleOpengraphImage
      title={title}
      beforeTitle={
        <div
          style={{
            fontSize: 32,
            color: "#71717a",
            textTransform: "uppercase",
            letterSpacing: 4,
            display: "flex",
          }}
        >
          {eyebrow}
        </div>
      }
      afterTitle={<OpengraphTags tags={tags} />}
    />
  );
}
