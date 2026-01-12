import fs from "node:fs/promises";
import path from "node:path";

import { resolveContentRoot } from "@/shared/lib/content-root";

export type AmazonProduct = {
  id: string;
  title: string;
  imageUrl: string;
  productUrl: string;
};

type AmazonProductSource = {
  products?: AmazonProduct[];
};

export async function getAmazonProducts(): Promise<AmazonProduct[]> {
  const root = await resolveContentRoot();
  const filePath = path.join(root, "amazon-products.json");

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as AmazonProductSource;
    if (!parsed.products || !Array.isArray(parsed.products)) {
      return [];
    }

    return parsed.products.filter((product): product is AmazonProduct => {
      return Boolean(product?.id && product?.title && product?.imageUrl && product?.productUrl);
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
