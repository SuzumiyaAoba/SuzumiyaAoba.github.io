/**
 * items 内で predicate に一致する要素の前後を offset で取得する。
 * 見つからなければ両方 null。範囲外の offset も自然に null になる。
 */
export function findAdjacentByIndex<T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
  offsets: { prevOffset: number; nextOffset: number } = { prevOffset: 1, nextOffset: -1 },
): { prev: T | null; next: T | null } {
  const index = items.findIndex(predicate);
  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: items[index + offsets.prevOffset] ?? null,
    next: items[index + offsets.nextOffset] ?? null,
  };
}
