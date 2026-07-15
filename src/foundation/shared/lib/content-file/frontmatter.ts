/**
 * frontmatter の値を型ガードしつつ変換するプリミティブ群。
 * スキーマ全体はジェネリック化せず、各 entity の normalizeFrontmatter が
 * これらを組み合わせてフィールドを組み立てる。
 */

/** 値が string であればそのまま返す */
export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** 値が string であればそのまま、そうでなければ fallback を返す */
export function asStringWithDefault(value: unknown, fallback: string): string {
  return asString(value) ?? fallback;
}

/** Date インスタンスは YYYY-MM-DD に、string はそのまま返す */
export function asDateString(value: unknown): string | undefined {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return asString(value);
}

/** 値が boolean であればそのまま返す */
export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/** 値が配列であれば string 要素のみにフィルタして返す(配列でなければ undefined) */
export function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}
