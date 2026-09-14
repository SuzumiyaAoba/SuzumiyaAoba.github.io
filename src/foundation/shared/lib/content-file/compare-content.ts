type DatedContent = {
  slug: string;
  frontmatter: { date?: string };
};

type LocalizedDatedContent = {
  slug: string;
  ja: DatedContent | null;
  en: DatedContent | null;
};

function compareDates(dateA: string, dateB: string): number {
  if (dateA === dateB) {
    return 0;
  }
  return dateA < dateB ? 1 : -1;
}

/** 日付の降順、同日付・日付なしの場合はスラッグの昇順に並べる。 */
export function compareContentByDate(a: DatedContent, b: DatedContent): number {
  return (
    compareDates(a.frontmatter.date ?? "", b.frontmatter.date ?? "") || a.slug.localeCompare(b.slug)
  );
}

/** 日本語版を基準とし、日本語版がなければ英語版の日付で比較する。 */
export function compareLocalizedContentByDate(
  a: LocalizedDatedContent,
  b: LocalizedDatedContent,
): number {
  return (
    compareDates((a.ja ?? a.en)?.frontmatter.date ?? "", (b.ja ?? b.en)?.frontmatter.date ?? "") ||
    a.slug.localeCompare(b.slug)
  );
}
