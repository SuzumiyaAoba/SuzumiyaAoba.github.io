import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import YAML from "yaml";

const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string(),
  productUrl: z.string(),
});

const productsSchema = z.object({
  products: z.array(productSchema),
});

export type AmazonProduct = z.infer<typeof productSchema>;

const AMAZON_PRODUCTS_PATH = path.join(
  process.cwd(),
  "src/data/amazon-products.yaml"
);

export async function getAmazonProducts(): Promise<AmazonProduct[]> {
  const raw = await fs.readFile(AMAZON_PRODUCTS_PATH, "utf-8");
  const parsed = YAML.parse(raw);
  const result = productsSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("amazon-products.yaml の形式が不正です。");
  }

  return result.data.products;
}

export async function getAmazonProductsByIds(
  ids: string[]
): Promise<AmazonProduct[]> {
  const products = await getAmazonProducts();
  const productMap = new Map(products.map((product) => [product.id, product]));

  return ids
    .map((id) => productMap.get(id))
    .filter((product): product is AmazonProduct => Boolean(product));
}
