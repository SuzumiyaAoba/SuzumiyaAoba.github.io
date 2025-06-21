"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

// PagefindResultのスキーマ定義
const pagefindResultSchema = z.object({
  url: z.string(),
  excerpt: z.string(),
  meta: z.object({
    title: z.string().optional(),
  }),
});

type PagefindResult = z.infer<typeof pagefindResultSchema>;

// PagefindSearchResponseの型定義
interface PagefindSearchResponse {
  results: {
    id: string;
    score: number;
    data: () => Promise<PagefindResult>;
  }[];
  term?: string;
  total?: number;
}

// PagefindModuleの型定義（直接インポートせず型だけ定義）
type PagefindModule = {
  search: (query: string) => Promise<PagefindSearchResponse>;
  filters: () => Promise<Record<string, string[]>>;
  debouncedSearch: (
    query: string,
    options?: Record<string, unknown>,
    debounceTimeoutMs?: number
  ) => Promise<PagefindSearchResponse>;
};

// グローバル型定義の追加
declare global {
  interface Window {
    pagefind: PagefindModule;
    __pagefind_loaded: boolean;
    __pagefind_loading: boolean;
  }
}

export default function SearchComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagefindError, setPagefindError] = useState<string | null>(null);
  const [pagefindLoaded, setPagefindLoaded] = useState(false);

  // デバウンス用タイマー
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 検索を実行
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (!window.pagefind || !window.__pagefind_loaded) {
      setPagefindError(
        "検索エンジンがロードされていません。しばらく待つか、ページを更新してください。"
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log("Executing search:", searchQuery);
      const search = await window.pagefind.search(searchQuery);

      if (!search || !search.results) {
        console.log("No search results or search object is invalid");
        setResults([]);
        setIsLoading(false);
        return;
      }

      // 検索結果をマップして処理
      const searchResults = await Promise.all(
        search.results.map(
          async (result: PagefindSearchResponse["results"][0]) => {
            const data = await result.data();
            return data;
          }
        )
      );

      // zodで型安全に結果を取得
      const validResults = z.array(pagefindResultSchema).parse(searchResults);
      setResults(validResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      setPagefindError("検索中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pagefindをロード
  useEffect(() => {
    // pagefind:initializedイベントのハンドラを登録
    function handlePagefindInitialized() {
      console.log("Pagefind initialized event received");
      setPagefindLoaded(true);
      if (initialQuery) {
        performSearch(initialQuery);
      }
    }

    // 既に初期化済みの場合
    if (window.__pagefind_loaded) {
      setPagefindLoaded(true);
      if (initialQuery) {
        performSearch(initialQuery);
      }
      return;
    }

    // 初期化イベントのリスナーを設定
    window.addEventListener("pagefind:initialized", handlePagefindInitialized);

    // スクリプトはページレベルで <Script> を使って注入されるため、ここでのフォールバックは不要
    // if (!document.querySelector('script[src="/pagefind-adapter.js"]')) {
    //   try {
    //     console.log("Loading pagefind adapter...");
    //     const script = document.createElement("script");
    //     script.src = "/pagefind-adapter.js";
    //     script.async = true;
    //     script.onerror = (e) => {
    //       console.error("Failed to load pagefind adapter script", e);
    //       setPagefindError(
    //         "検索インデックスの読み込みに失敗しました。ページを更新してください。"
    //       );
    //     };
    //     document.head.appendChild(script);
    //   } catch (error) {
    //     console.error("Failed to load pagefind adapter", error);
    //     setPagefindError(
    //       "検索インデックスの読み込みに失敗しました。ページを更新してください。"
    //     );
    //   }
    // }

    // クリーンアップ関数
    return () => {
      window.removeEventListener(
        "pagefind:initialized",
        handlePagefindInitialized
      );
    };
  }, [initialQuery, performSearch]);

  // 入力時のハンドラー - デバウンスロジック
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // 前回のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 300ms後に検索を実行
    timerRef.current = setTimeout(() => {
      // URLパラメータを更新
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (newQuery) {
        params.set("q", newQuery);
      } else {
        params.delete("q");
      }

      // URLを更新 (スクロールなし)
      router.push(`/search?${params.toString()}`, { scroll: false });

      // 実際に検索を実行
      performSearch(newQuery);
    }, 300);
  };

  const handleDevSetup = () => {
    // 開発環境セットアップ用のコマンドを実行するよう指示
    alert(
      "開発環境でPagefindを使用するには、以下のコマンドを実行してください：\n\nnpm run build\nnpm run pagefind:dev\nnpm run dev"
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="検索キーワードを入力..."
            className="flex-1 p-2 border rounded-md"
            style={{
              color: "var(--foreground)",
              backgroundColor: "var(--input-bg)",
            }}
            aria-label="検索"
            disabled={!!pagefindError || !pagefindLoaded}
          />
        </div>
      </div>

      {pagefindError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <p className="text-yellow-800 mb-2">{pagefindError}</p>
          <button
            onClick={handleDevSetup}
            className="text-blue-600 hover:underline"
          >
            開発環境用セットアップ手順を表示
          </button>
        </div>
      )}

      {!pagefindLoaded && !pagefindError ? (
        <div className="py-4">
          <p>検索エンジンを読み込み中...</p>
        </div>
      ) : isLoading ? (
        <div className="py-4">
          <p>検索中...</p>
        </div>
      ) : (
        <div>
          {results.length > 0 ? (
            <div>
              <p className="mb-4">{results.length}件の検索結果</p>
              <div className="space-y-6">
                {results.map((result, index) => (
                  <div key={index} className="border-b pb-4">
                    <h3 className="text-xl font-semibold mb-2">
                      <a
                        href={result.url}
                        className="hover:underline"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        {result.meta.title || "タイトルなし"}
                      </a>
                    </h3>
                    {result.excerpt && (
                      <div
                        style={{ color: "var(--muted)" }}
                        dangerouslySetInnerHTML={{ __html: result.excerpt }}
                      />
                    )}
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--muted-secondary)" }}
                    >
                      <a href={result.url} className="hover:underline">
                        {result.url}
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : query && !isLoading ? (
            <p>
              検索結果が見つかりませんでした。別のキーワードをお試しください。
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
