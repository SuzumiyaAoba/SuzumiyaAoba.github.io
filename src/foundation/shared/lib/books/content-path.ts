/**
 * 書籍コンテンツ（`content/books/<book>/`）のパス解決ユーティリティ。
 *
 * 書籍の画像などのアセットは、ブック直下の `content/books/<book>/images/` に
 * まとめて配置する。各節（`parts/<NN>/chapters/<NN>/*.md`）の Markdown からは、
 * 階層の深さに関わらず `![alt](./images/foo.svg)` のように相対参照する。
 *
 * MDX をレンダリングする際、`renderMdx` / `renderMdxWithToc` の `basePath` に
 * {@link bookContentBasePath} を渡すと、`./images/...` が
 * `/contents/books/<book>/images/...` に解決され、`app/contents/[...path]`
 * ルートが実ファイルを配信する。
 *
 * @example
 * ```ts
 * const basePath = bookContentBasePath("java-abc");
 * // → "/contents/books/java-abc"
 * await renderMdx(source, { basePath });
 * // Markdown 内の ![](./images/foo.svg)
 * //   → /contents/books/java-abc/images/foo.svg
 * ```
 */

/** 書籍コンテンツが配信される URL のプレフィックス */
export const BOOKS_CONTENT_BASE = "/contents/books";

/**
 * 指定した書籍の画像・アセットを解決するための basePath を返す。
 *
 * 返り値を MDX レンダリングの `basePath` に渡すことで、節がどれだけ深い階層に
 * あっても、Markdown 内の `./images/...` がブック直下の
 * `content/books/<book>/images/...` に解決される。
 *
 * @param bookSlug 書籍のスラッグ（例: `"java-abc"`）。前後のスラッシュは除去される
 * @returns 例: `"/contents/books/java-abc"`
 */
export function bookContentBasePath(bookSlug: string): string {
  const normalized = bookSlug.replace(/^\/+|\/+$/g, "");
  return `${BOOKS_CONTENT_BASE}/${normalized}`;
}
