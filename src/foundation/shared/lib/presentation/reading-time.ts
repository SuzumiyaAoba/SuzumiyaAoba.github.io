/** 和文を 1 分あたりに読める文字数 */
const CJK_CHARS_PER_MINUTE = 500;
/** 欧文を 1 分あたりに読める語数 */
const WORDS_PER_MINUTE = 200;

const FENCED_CODE_RE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gmu;
const MDX_STATEMENT_RE = /^(?:import|export)\s[^\n]*$/gmu;
const TAG_RE = /<[^>]+>/gu;
const LINK_TARGET_RE = /\]\([^)]*\)/gu;
const CJK_RE = /[぀-ヿ㐀-鿿豈-﫿ｦ-ﾟ]/gu;
const WORD_RE = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/gu;

/**
 * Markdown/MDX 本文のおおよその読了時間（分）を見積もる。
 * コードブロック・MDX の import/export・タグ・リンク先 URL は読む文章に含めない。
 * @param source 本文の Markdown/MDX
 * @returns 1 以上の分数
 */
export function estimateReadingMinutes(source: string): number {
  const prose = source
    .replaceAll(FENCED_CODE_RE, "")
    .replaceAll(MDX_STATEMENT_RE, "")
    .replaceAll(TAG_RE, "")
    .replaceAll(LINK_TARGET_RE, "]");
  const cjkCount = prose.match(CJK_RE)?.length ?? 0;
  const wordCount = prose.replaceAll(CJK_RE, " ").match(WORD_RE)?.length ?? 0;
  const minutes =
    cjkCount / CJK_CHARS_PER_MINUTE + wordCount / WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}
