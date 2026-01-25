import type { ComponentProps } from "react";

import { getAffiliateProductsByIds } from "@/shared/lib/affiliate-products";
import { AmazonProductSection as AmazonProductSectionUI } from "@/shared/ui/amazon/amazon-product-section";

export type MdxAmazonProductSectionProps = {
  /** affiliate-products.json の id を並べる */
  ids: string[] | string;
} & Omit<ComponentProps<typeof AmazonProductSectionUI>, "products">;

/**
 * MDX から Amazon 商品カードを表示するためのラッパー
 */
export async function AmazonProductSection({ ids, ...props }: MdxAmazonProductSectionProps) {
  const rawIds = Array.isArray(ids) ? ids : [ids];
  const uniqueIds: string[] = [];
  const seen = new Set<string>();

  for (const id of rawIds) {
    if (typeof id !== "string") {
      continue;
    }
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
