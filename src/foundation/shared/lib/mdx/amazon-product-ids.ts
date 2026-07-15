/**
 * MDX 内にある Amazon 商品カードの ids を抽出する
 */
export function extractAmazonProductIdsFromMdx(source: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();
  const componentRegex = /<AmazonProductSection\b[\s\S]*?>/g;
  const idsPropRegex = /\bids\s*=\s*({[\s\S]*?}|"[^"]*"|'[^']*')/;

  for (const match of source.matchAll(componentRegex)) {
    const tag = match[0];
    const idsMatch = tag.match(idsPropRegex);
    if (!idsMatch) {
      continue;
    }
    const rawValue = idsMatch[1]?.trim() ?? "";
    let candidates: string[] = [];
    if (rawValue.startsWith("{") && rawValue.endsWith("}")) {
      const inner = rawValue.slice(1, -1);
      const quoted = [...inner.matchAll(/"([^"]+)"|'([^']+)'/g)];
      candidates = quoted
        .map((quotedValue) => quotedValue[1] ?? quotedValue[2])
        .filter((value): value is string => Boolean(value));
    } else if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      candidates = [rawValue.slice(1, -1)];
    }

    for (const candidate of candidates) {
      const normalized = candidate.trim();
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      results.push(normalized);
    }
  }

  return results;
}
