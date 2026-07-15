/** 一覧ページの1ページあたりの件数 */
export const DEFAULT_PAGE_SIZE = 10;

/** 総件数からページ数を計算する(最低1ページ) */
export function getPageCount(total: number, pageSize: number = DEFAULT_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** 指定ページ(1始まり)に対応する要素を切り出す */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
