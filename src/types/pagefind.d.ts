/**
 * Pagefind用の型定義ファイル
 * これは単純な型定義で、TypeScriptエラーを解消するためのものです
 */

// SearchResultの型定義
interface PagefindResult {
  url: string;
  excerpt: string;
  meta: {
    title?: string;
    [key: string]: string | string[] | undefined;
  };
  content?: string;
  word_count?: number;
  score?: number;
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | Record<string, string | string[] | undefined>;
}

// Pagefind検索結果の型
interface PagefindSearchResponse {
  results: {
    id: string;
    score: number;
    data: () => Promise<PagefindResult>;
  }[];
  // 追加のプロパティ
  term?: string;
  total?: number;
}

// Pagefindモジュールの型
interface PagefindModule {
  search: (query: string) => Promise<PagefindSearchResponse>;
  options: (opts: Record<string, unknown>) => Promise<void>;
  // 他のAPIメソッドがあれば追加
}

// デフォルトエクスポート
declare const pagefind: PagefindModule;
export default pagefind;
