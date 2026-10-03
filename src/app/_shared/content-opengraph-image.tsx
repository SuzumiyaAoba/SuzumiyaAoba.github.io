import { ArticleOpengraphImage, renderOpengraphImage } from "./opengraph-image";

export { OPENGRAPH_IMAGE_SIZE as CONTENT_OPENGRAPH_IMAGE_SIZE } from "./opengraph-image";

export type RenderContentOpengraphImageOptions = {
  /** 種別ラベル(例: "連載", "タグ", "書籍", "Notes") */
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
    <ArticleOpengraphImage kicker={eyebrow} title={title} tags={tags} />
  );
}
