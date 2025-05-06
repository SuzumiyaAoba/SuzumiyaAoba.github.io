"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";

// インターフェースを修正してグローバルWindowに型を追加
declare global {
  interface Window {
    pagefind: any;
  }
}

interface SearchResult {
  id: string;
  data: {
    url: string;
    title: string;
    content?: string;
    excerpt?: string;
  };
}

export default function SearchComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagefindLoaded, setPagefindLoaded] = useState(false);
  const [pagefindError, setPagefindError] = useState<string | null>(null);

  // デバウンス用タイマー
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pagefindをロード
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handlePagefindLoaded = () => {
        console.log("Pagefind load event received");
        setPagefindLoaded(true);
        setPagefindError(null);

        if (initialQuery) {
          performSearch(initialQuery);
        }
      };

      // すでにロードされているか確認
      if (window.pagefind) {
        console.log("Pagefind is already loaded");
        setPagefindLoaded(true);

        if (initialQuery) {
          performSearch(initialQuery);
        }
        return;
      }

      // イベントリスナーを追加
      document.addEventListener("pagefind-loaded", handlePagefindLoaded);

      return () => {
        document.removeEventListener("pagefind-loaded", handlePagefindLoaded);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 検索を実行 - 引数で直接検索クエリを受け取るように変更
  const performSearch = useCallback(async (searchQuery: string) => {
    console.log(`performSearch called with query: "${searchQuery}"`);

    if (!searchQuery) {
      console.log("Empty query, clearing results");
      setResults([]);
      return;
    }

    if (!window.pagefind) {
      console.error("Pagefind not loaded");
      setPagefindError(
        "Pagefind is not loaded. Please wait a moment or reload the page."
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

      console.log(`Found ${search.results.length} raw results`);

      const searchResults = await Promise.all(
        search.results.map(async (result: any) => {
          const data = await result.data();
          return {
            id: result.id,
            data: {
              url: data.url,
              title: data.meta?.title || "No Title",
              excerpt: data.excerpt,
            },
          };
        })
      );

      console.log("Search results:", searchResults.length);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      setPagefindError("An error occurred during search.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 入力時のハンドラー - デバウンスロジックをここに統合
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    console.log(`Input changed to: "${newQuery}"`);
    setQuery(newQuery);

    // 前回のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 300ms後に検索を実行
    timerRef.current = setTimeout(() => {
      console.log(`Debounce timer fired for query: "${newQuery}"`);

      // URLパラメータを更新
      const params = new URLSearchParams(searchParams.toString());
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

  // スクリプトのロード完了を通知するイベント
  const handleScriptLoad = () => {
    console.log("Pagefind script loaded");
    const event = new Event("pagefind-loaded");
    document.dispatchEvent(event);
  };

  const handleDevSetup = () => {
    // 開発環境セットアップ用のコマンドを実行するよう指示
    alert(
      "To use Pagefind in development environment, run these commands:\n\nnpm run build\nnpm run pagefind:dev\nnpm run dev"
    );
  };

  return (
    <div className="w-full">
      <Script
        src="/pagefind/pagefind.js"
        strategy="beforeInteractive"
        onLoad={handleScriptLoad}
        onError={() => {
          console.error("Failed to load Pagefind script");
          setPagefindError("Failed to load search index.");
        }}
      />

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Enter search terms..."
            className="flex-1 p-2 border rounded-md"
            aria-label="Search"
            disabled={!!pagefindError}
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
            Show setup instructions
          </button>
        </div>
      )}

      {isLoading && <div className="text-center py-4">Searching...</div>}

      {!isLoading && results.length > 0 && (
        <div>
          <p className="mb-4">{results.length} results found:</p>
          <ul className="space-y-4">
            {results.map((result) => (
              <li key={result.id} className="border-b pb-4">
                <a
                  href={result.data.url}
                  className="text-blue-600 hover:underline text-lg font-medium"
                >
                  {result.data.title}
                </a>
                {result.data.excerpt && (
                  <p
                    className="mt-1 text-gray-600"
                    dangerouslySetInnerHTML={{ __html: result.data.excerpt }}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && query && results.length === 0 && !pagefindError && (
        <div className="text-center py-4">
          No results found for &quot;{query}&quot;.
        </div>
      )}
    </div>
  );
}
