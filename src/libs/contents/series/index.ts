/**
 * Series Management Module
 *
 * このモジュールは以下のサブモジュールから構成されています：
 * - types.ts: 型定義
 * - schema.ts: Zodスキーマ
 * - utils.ts: ユーティリティ関数（エンコード/デコード）
 * - loader.ts: シリーズ定義の読み込み
 * - service.ts: シリーズ管理のメインサービス
 */

// 型定義
export type {
  SeriesContent,
  SeriesPost,
  SeriesInfo,
  SeriesNavigation,
} from "./types";

// スキーマ
export { seriesDefinitionSchema, type SeriesDefinition } from "./schema";

// ユーティリティ
export {
  generateSlugFromSeriesName,
  encodeSeriesName,
  decodeSeriesName,
} from "./utils";

// ローダー
export { loadSeriesDefinitions } from "./loader";

// サービス関数
export {
  getAllSeries,
  getSeriesBySlug,
  getSeriesPosts,
  getSeriesPostsBySlug,
  findSeriesByPostSlug,
  getSeriesNavigation,
} from "./service";
