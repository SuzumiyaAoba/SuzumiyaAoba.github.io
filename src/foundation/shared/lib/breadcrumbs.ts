import { getSiteUrl } from "@/shared/lib/site-url";

/**
 * パンくずリストの項目
 */
export type BreadcrumbItem = {
  /** 表示名 */
  name: string;
  /** パス */
  path: string;
};

/**
 * 構造化データ（JSON-LD）形式のパンくずリストを生成する
 * @param items パンくずリストの項目の配列
 * @returns JSON-LD オブジェクト
 */
export function buildBreadcrumbList(items: BreadcrumbItem[]) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}
