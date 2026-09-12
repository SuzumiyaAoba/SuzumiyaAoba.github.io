import matter from "gray-matter";

/** キャッシュは読み込み側で管理し、解析途中のデータを別の読み込みに渡さない。 */
export function parseContent<Frontmatter>(
  raw: string,
  normalizeFrontmatter: (data: Record<string, unknown>) => Frontmatter,
) {
  // gray-matter は解析前にキャッシュするため、失敗した入力も再利用してしまう。
  // options を明示すると内部キャッシュを使わず、常に完全な解析結果を取得できる。
  const { content, data } = matter(raw, {});
  return { content, frontmatter: normalizeFrontmatter(data) };
}
