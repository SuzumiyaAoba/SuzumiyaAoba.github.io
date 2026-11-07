/**
 * リンク先の HTML から取り出す、リンクカードの表示用メタデータ。
 *
 * scripts/fetch-link-cards.mjs が Node から直接読み込むため、
 * import を持たず、型の除去だけで動く構文に限る。
 */
export type LinkCardMetadata = {
  title: string;
  description?: string;
};

const HEAD_END = /<\/head\s*>/iu;
/** 属性値の引用符の中にある `>` でタグが終わったと見なさない。 */
const META_TAG = /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/giu;
const TITLE_TAG = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/iu;
const ATTRIBUTE =
  /([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gu;
const ENTITY = /&(#x[0-9a-f]+|#\d+|[a-z]+);/giu;
const WHITESPACE = /\s+/gu;

const MAX_CODE_POINT = 0x10_ff_ff;
const SURROGATE_START = 0xd8_00;
const SURROGATE_END = 0xdf_ff;
/** 題や要約によく現れるものだけ。ここにない名前はそのまま残す。 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  middot: "·",
  bull: "•",
  times: "×",
  yen: "¥",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
};

function decodeEntity(match: string, body: string): string {
  if (body.startsWith("#")) {
    const isHex = body[1] === "x" || body[1] === "X";
    const codePoint = isHex
      ? Number.parseInt(body.slice(2), 16)
      : Number.parseInt(body.slice(1), 10);
    const isSurrogate =
      codePoint >= SURROGATE_START && codePoint <= SURROGATE_END;
    return Number.isInteger(codePoint) &&
      codePoint > 0 &&
      codePoint <= MAX_CODE_POINT &&
      !isSurrogate
      ? String.fromCodePoint(codePoint)
      : match;
  }
  return NAMED_ENTITIES[body.toLowerCase()] ?? match;
}

function normalizeText(text: string | undefined): string | undefined {
  const normalized = text
    ?.replace(ENTITY, decodeEntity)
    .replace(WHITESPACE, " ")
    .trim();
  return normalized === "" ? undefined : normalized;
}

function parseAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const [, name, doubleQuoted, singleQuoted, bare] of tag.matchAll(
    ATTRIBUTE
  )) {
    const key = name?.toLowerCase();
    if (key !== undefined && !attributes.has(key)) {
      attributes.set(key, doubleQuoted ?? singleQuoted ?? bare ?? "");
    }
  }
  return attributes;
}

/** `<meta property|name="..." content="...">` を、先に現れたものを優先して集める。 */
function collectMeta(head: string): Map<string, string> {
  const meta = new Map<string, string>();
  for (const [tag] of head.matchAll(META_TAG)) {
    const attributes = parseAttributes(tag);
    const key = (
      attributes.get("property") ?? attributes.get("name")
    )?.toLowerCase();
    const content = attributes.get("content");
    if (key !== undefined && content !== undefined && !meta.has(key)) {
      meta.set(key, content);
    }
  }
  return meta;
}

function firstText(candidates: (string | undefined)[]): string | undefined {
  return candidates.map((candidate) => normalizeText(candidate)).find(Boolean);
}

/**
 * HTML からタイトルと要約を取り出す。
 * タイトルは og:title、twitter:title、`<title>` の順。
 * 要約は og:description、twitter:description、description の順。
 * タイトルが見つからなければ null。
 */
export function parseLinkCardMetadata(html: string): LinkCardMetadata | null {
  const headEnd = HEAD_END.exec(html);
  const head = headEnd ? html.slice(0, headEnd.index) : html;
  const meta = collectMeta(head);

  const title = firstText([
    meta.get("og:title"),
    meta.get("twitter:title"),
    TITLE_TAG.exec(head)?.[1],
  ]);
  if (title === undefined) {
    return null;
  }

  const description = firstText([
    meta.get("og:description"),
    meta.get("twitter:description"),
    meta.get("description"),
  ]);

  return description === undefined ? { title } : { title, description };
}
