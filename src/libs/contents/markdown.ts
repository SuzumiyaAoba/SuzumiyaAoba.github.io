/**
 * Content processing pipeline
 *
 * このモジュールは以下のモジュールから機能を再エクスポートしています：
 * - types.ts: 型定義
 * - file-loader.ts: ファイル読み込み
 * - parser.ts: フロントマター解析
 * - query.ts: コンテンツ検索
 * - renderer.ts: レンダリング
 * - processor.ts: プロセッサー構築
 */

// 型定義
export type { RawContent, Content, ParsedContent, Format } from "./types";

// ファイル読み込み
export {
  getRawContent,
  getStylesheets,
  getAvailableLanguages,
  hasEnglishVersion,
} from "./file-loader";

// フロントマター解析
export { parseRawContent, getFrontmatter } from "./parser";

// コンテンツ検索
export { getPaths, getFrontmatters } from "./query";

// レンダリング
export { getContent } from "./renderer";

// プロセッサー構築（必要に応じて）
export { createProcessor } from "./processor";
