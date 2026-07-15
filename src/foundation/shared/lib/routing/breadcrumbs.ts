import { getSiteUrl } from "@/shared/lib/site/site-url";
import { toLocalePath, type Locale } from "./locale-path";

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
/**
 * 「Home > セクション > 詳細アイテム」の3階層パンくず項目を組み立てる。
 * JsonLd用(buildBreadcrumbList)と表示用(Breadcrumbsコンポーネント)の両方に
 * 同じ配列を渡せるよう、detail系ページで共通化するためのヘルパー。
 * @param locale 表示ロケール
 * @param section セクション名とロケール非依存のパス(例: `{ name: "Books", path: "/books" }`)
 * @param item 詳細アイテムの表示名と解決済みパス
 */
export function buildDetailBreadcrumbItems(
  locale: Locale,
  section: BreadcrumbItem,
  item: BreadcrumbItem,
): BreadcrumbItem[] {
  return [
    { name: "Home", path: toLocalePath("/", locale) },
    { name: section.name, path: toLocalePath(section.path, locale) },
    item,
  ];
}

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
