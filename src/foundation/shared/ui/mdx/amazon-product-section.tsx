import type { ComponentProps } from "react";

import { getAffiliateProductsByIds } from "@/shared/lib/affiliate-products";
import { AmazonProductSection as AmazonProductSectionUI } from "@/shared/ui/amazon/amazon-product-section";

export type MdxAmazonProductSectionProps = {
  /** affiliate-products.json の id を並べる */
  ids: unknown;
} & Omit<ComponentProps<typeof AmazonProductSectionUI>, "products">;

function extractIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractIds(item));
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return [];
    }

    if (
      (normalized.startsWith("[") && normalized.endsWith("]")) ||
      (normalized.startsWith("{") && normalized.endsWith("}"))
    ) {
      try {
        return extractIds(JSON.parse(normalized) as unknown);
      } catch {
        const quoted = [...normalized.matchAll(/"([^"]+)"|'([^']+)'/g)]
          .map((match) => match[1] ?? match[2])
          .filter((item): item is string => Boolean(item));
        if (quoted.length > 0) {
          return quoted;
        }
      }
    }

    if (normalized.includes(",")) {
      return normalized
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [normalized];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((item) => extractIds(item));
  }

  return [];
}

/**
 * MDX から Amazon 商品カードを表示するためのラッパー
 */
export async function AmazonProductSection({ ids, ...props }: MdxAmazonProductSectionProps) {
  const uniqueIds: string[] = [];
  const seen = new Set<string>();

  for (const id of extractIds(ids)) {
    const normalized = id.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    uniqueIds.push(normalized);
  }

  const products = await getAffiliateProductsByIds(uniqueIds);
  return <AmazonProductSectionUI products={products} {...props} />;
}
