"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";


import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

type PagefindResult = {
  url: string;
  excerpt: string;
  meta: {
    title?: string;
  };
};

type PagefindSearchResponse = {
  results: Array<{
    id: string;
    score: number;
    data: () => Promise<PagefindResult>;
  }>;
  term?: string;
  total?: number;
};

type PagefindModule = {
  search: (query: string) => Promise<PagefindSearchResponse>;
};

declare global {
  interface Window {
    pagefind?: PagefindModule;
    __pagefind_loaded?: boolean;
    __pagefind_loading?: boolean;
  }
}

function formatUrl(url: string): string {
  try {
    const parsed = new URL(url, "https://example.com");
    return parsed.pathname;
  } catch {
    return url;
  }
}

export function SearchPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagefindLoaded, setPagefindLoaded] = useState(false);
  const [pagefindError, setPagefindError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (!window.pagefind || !window.__pagefind_loaded) {
      setPagefindError(
        "検索エンジンがまだ読み込まれていません。しばらく待つか、ページを更新してください。",
      );
      return;
    }

    setIsLoading(true);
    setPagefindError(null);

    try {
      const search = await window.pagefind.search(searchQuery);
      const searchResults = await Promise.all(search.results.map(async (result) => result.data()));
      setResults(searchResults.filter(Boolean));
    } catch {
      setResults([]);
      setPagefindError("検索中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    function handlePagefindInitialized() {
      setPagefindLoaded(true);
      setPagefindError(null);
      if (initialQuery) {
        performSearch(initialQuery);
      }
    }

    function handlePagefindError(event: CustomEvent) {
      const detail = event.detail as { error?: string } | undefined;
      setPagefindError(`検索エンジンの読み込みに失敗しました。${detail?.error ?? ""}`.trim());
    }

    if (window.__pagefind_loaded) {
      setPagefindLoaded(true);
      if (initialQuery) {
        performSearch(initialQuery);
      }
      return;
    }

    window.addEventListener("pagefind:initialized", handlePagefindInitialized);
    window.addEventListener("pagefind:error", handlePagefindError as EventListener);

    const timeoutId = window.setTimeout(() => {
      if (!window.__pagefind_loaded && !window.__pagefind_loading) {
        setPagefindError("検索エンジンの読み込みがタイムアウトしました。");
      }
    }, 10000);

    return () => {
      window.removeEventListener("pagefind:initialized", handlePagefindInitialized);
      window.removeEventListener("pagefind:error", handlePagefindError as EventListener);
      window.clearTimeout(timeoutId);
    };
  }, [initialQuery, performSearch]);

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      const queryString = params.toString();
      router.replace(queryString ? `/search?${queryString}` : "/search", {
        scroll: false,
      });
      performSearch(value);
    }, 300);
  };

  return (
    <div className="space-y-6">
      <Card className="border-transparent bg-card/40 shadow-none">
        <div className="px-4 py-4">
          <Input
            value={query}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder="キーワードで検索..."
            aria-label="検索キーワード"
            disabled={Boolean(pagefindError) || !pagefindLoaded}
          />
        </div>
      </Card>

      {pagefindError ? (
        <Card className="border-transparent bg-muted/40 shadow-none">
          <div className="space-y-2 px-4 py-4 text-sm text-muted-foreground">
            <p>{pagefindError}</p>
            <p className="text-xs">
              ビルド後に Pagefind
              を実行していない場合は、検索インデックスが生成されていない可能性があります。
            </p>
          </div>
        </Card>
      ) : !pagefindLoaded ? (
        <div className="text-sm text-muted-foreground">検索エンジンを読み込み中...</div>
      ) : isLoading ? (
        <div className="text-sm text-muted-foreground">検索中...</div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="bg-muted text-xs text-muted-foreground">
              {results.length} 件
            </Badge>
            <span>検索結果</span>
          </div>
          <ul className="space-y-4">
            {results.map((result) => (
              <li key={result.url}>
                <Card className="border-transparent bg-card/40 shadow-none">
                  <a
                    href={result.url}
                    className="flex flex-col gap-2 px-5 py-5 transition-colors hover:text-foreground/80"
                  >
                    <h2 className="text-base font-semibold text-foreground">
                      {result.meta.title ?? "タイトルなし"}
                    </h2>
                    {result.excerpt ? (
                      <div
                        className="text-sm leading-6 text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: result.excerpt }}
                      />
                    ) : null}
                    <span className="text-xs text-muted-foreground">{formatUrl(result.url)}</span>
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : query ? (
        <div className="text-sm text-muted-foreground">
          検索結果が見つかりませんでした。別のキーワードをお試しください。
        </div>
      ) : null}
    </div>
  );
}
