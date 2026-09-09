"use client";

import { useEffect, useState } from "react";

type PagefindResult = {
  url: string;
  excerpt: string;
  meta: { title?: string };
};

type PagefindModule = {
  search: (query: string) => Promise<{
    results: Array<{ data: () => Promise<PagefindResult> }>;
  }>;
};

declare global {
  interface Window {
    pagefind?: PagefindModule;
    __pagefind_loaded?: boolean;
    __pagefind_loading?: boolean;
  }
}

type SearchError = {
  key: "notLoaded" | "searchError" | "loadFailed" | "timeout";
  detail?: string;
};

type SearchState = {
  results: PagefindResult[];
  isLoading: boolean;
  error: SearchError | null;
};

export function usePagefindSearch(query: string) {
  const [pagefindLoaded, setPagefindLoaded] = useState(false);
  const [loadError, setLoadError] = useState<SearchError | null>(null);
  const [search, setSearch] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!window.__pagefind_loaded) {
        setLoadError({ key: "timeout" });
      }
    }, 10000);

    function handleInitialized() {
      window.clearTimeout(timeoutId);
      setPagefindLoaded(true);
      setLoadError(null);
    }

    function handleError(event: Event) {
      window.clearTimeout(timeoutId);
      const { detail } = event as CustomEvent<{ error?: string }>;
      setPagefindLoaded(false);
      setLoadError({ key: "loadFailed", detail: detail?.error ?? "" });
    }

    window.addEventListener("pagefind:initialized", handleInitialized);
    window.addEventListener("pagefind:error", handleError);
    if (window.__pagefind_loaded) handleInitialized();

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("pagefind:initialized", handleInitialized);
      window.removeEventListener("pagefind:error", handleError);
    };
  }, []);

  useEffect(() => {
    if (!pagefindLoaded) return;

    const searchQuery = query.trim();
    setSearch({ results: [], isLoading: Boolean(searchQuery), error: null });
    if (!searchQuery) return;

    const pagefind = window.pagefind;
    if (!pagefind) {
      setSearch({ results: [], isLoading: false, error: { key: "notLoaded" } });
      return;
    }

    // クエリ変更・画面離脱後に完了したリクエストは結果を反映しない。
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await pagefind.search(searchQuery);
        if (cancelled) return;

        const results = await Promise.all(response.results.map((result) => result.data()));
        if (!cancelled) {
          setSearch({ results, isLoading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setSearch({ results: [], isLoading: false, error: { key: "searchError" } });
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pagefindLoaded, query]);

  return { ...search, pagefindLoaded, error: loadError ?? search.error };
}
