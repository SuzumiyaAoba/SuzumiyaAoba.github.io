import fs from "node:fs/promises";
import path from "node:path";

import { resolveContentRoot } from "@/shared/lib/content-root";

export type AmazonProduct = {
  id: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  tags?: string[];
};

type AmazonProductSource = {
  products?: AmazonProduct[];
};

async function getAmazonProducts(): Promise<AmazonProduct[]> {
  const root = await resolveContentRoot();
  const filePath = path.join(root, "amazon-products.json");

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as AmazonProductSource;
    if (!parsed.products || !Array.isArray(parsed.products)) {
      return [];
    }

    return parsed.products
      .filter((product): product is AmazonProduct => {
        return Boolean(product?.id && product?.title && product?.imageUrl && product?.productUrl);
      })
      .map((product) => {
        const tags = Array.isArray(product.tags)
          ? product.tags.filter((tag): tag is string => typeof tag === "string")
          : undefined;
        return {
          ...product,
          ...(tags ? { tags } : {}),
        };
      });
  } catch {
    return [];
  }
}

export async function getAmazonProductsByIds(ids: string[]): Promise<AmazonProduct[]> {
  const products = await getAmazonProducts();
  const map = new Map(products.map((product) => [product.id, product]));
  return ids.map((id) => map.get(id)).filter((item): item is AmazonProduct => Boolean(item));
}

type AmazonProductTagOptions = {
  excludeIds?: string[];
  limit?: number;
};

export async function getAmazonProductsByTags(
  tags: string[],
  options?: AmazonProductTagOptions,
): Promise<AmazonProduct[]> {
  if (tags.length === 0) {
    return [];
  }

  const products = await getAmazonProducts();
  const normalizedTags = new Set(tags.map((tag) => tag.trim()).filter(Boolean));
  const excluded = new Set(options?.excludeIds ?? []);
  const matches = products.filter((product) => {
    if (excluded.has(product.id)) {
      return false;
    }
    if (!product.tags || product.tags.length === 0) {
      return false;
    }
    return product.tags.some((tag) => normalizedTags.has(tag));
  });

  const limit = options?.limit;
  if (typeof limit === "number") {
    return matches.slice(0, Math.max(0, limit));
  }

  return matches;
}
