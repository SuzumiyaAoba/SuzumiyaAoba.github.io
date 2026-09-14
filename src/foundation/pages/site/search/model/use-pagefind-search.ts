"use client";

import { useEffect, useState } from "react";
import { isRecord } from "@/shared/lib/types";

type PagefindResult = {
  url: string;
  excerpt: string;
  meta: { title?: string };
};

export type PagefindModule = {
  search: (query: string) => Promise<{
    results: { data: () => Promise<PagefindResult> }[];
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
    }, 10_000);

    function handleInitialized() {
      window.clearTimeout(timeoutId);
      setPagefindLoaded(true);
      setLoadError(null);
    }

    function handleError(event: Event) {
      window.clearTimeout(timeoutId);
      const detail: unknown = event instanceof CustomEvent ? event.detail : undefined;
      const message =
        isRecord(detail) && typeof detail["error"] === "string" ? detail["error"] : "";
      setPagefindLoaded(false);
      setLoadError({ key: "loadFailed", detail: message });
    }

    window.addEventListener("pagefind:initialized", handleInitialized);
    window.addEventListener("pagefind:error", handleError);
    if (window.__pagefind_loaded) {
      handleInitialized();
    }

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("pagefind:initialized", handleInitialized);
      window.removeEventListener("pagefind:error", handleError);
    };
  }, []);

  useEffect(() => {
    if (!pagefindLoaded) {
      return;
    }

    const searchQuery = query.trim();
    setSearch({ results: [], isLoading: Boolean(searchQuery), error: null });
    if (!searchQuery) {
      return;
    }

    const { pagefind } = window;
    if (!pagefind) {
      setSearch({ results: [], isLoading: false, error: { key: "notLoaded" } });
      return;
    }

    // クエリ変更・画面離脱後に完了したリクエストは結果を反映しない。
    let cancelled = false;
    const searchPagefind = pagefind.search;
    async function runSearch() {
      try {
        const response = await searchPagefind(searchQuery);
        if (cancelled) {
          return;
        }

        const results = await Promise.all(response.results.map(async (result) => result.data()));
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- await 中に effect の cleanup が cancelled を変更できる。
        if (!cancelled) {
          setSearch({ results, isLoading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setSearch({ results: [], isLoading: false, error: { key: "searchError" } });
        }
      }
    }
    const timeoutId = window.setTimeout(() => {
      void runSearch();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pagefindLoaded, query]);

  return { ...search, pagefindLoaded, error: loadError ?? search.error };
}
