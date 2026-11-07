/**
 * MDX の本文から `<LinkCard url="..." />` の URL を取り出す。
 *
 * scripts/fetch-link-cards.mjs が Node から直接読み込むため、
 * import を持たず、型の除去だけで動く構文に限る。
 * 文字列リテラルの url だけが対象で、`url={...}` の式は拾わない。
 * コードブロックとインラインコードの中の例示は対象にしない。
 */
const FENCED_CODE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1/gmu;
const INLINE_CODE = /`[^`\n]*`/gu;
/** 属性値の引用符の中にある `>` でタグが終わったと見なさない。 */
const LINK_CARD_TAG = /<LinkCard\b(?:[^>"']|"[^"]*"|'[^']*')*>/gu;
/** 値を引用符ごと読み進めるので、別の属性値の中の `url=` や `data-url` を拾わない。 */
const STRING_ATTRIBUTE = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu;

function findUrlAttribute(tag: string): string | undefined {
  for (const [, name, doubleQuoted, singleQuoted] of tag.matchAll(
    STRING_ATTRIBUTE
  )) {
    if (name === "url") {
      return (doubleQuoted ?? singleQuoted)?.trim();
    }
  }
  return undefined;
}

/** 本文に現れた順で、重複を除いた URL を返す。 */
export function extractLinkCardUrls(source: string): string[] {
  const text = source.replace(FENCED_CODE, "").replace(INLINE_CODE, "");
  const urls = new Set<string>();
  for (const [tag] of text.matchAll(LINK_CARD_TAG)) {
    const url = findUrlAttribute(tag);
    if (url) {
      urls.add(url);
    }
  }
  return [...urls];
}
