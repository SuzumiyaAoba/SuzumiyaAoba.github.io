"use client";

import { useRef } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { Search, X } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { usePagefindSearch } from "../model/use-pagefind-search";

const queryParser = parseAsString.withDefault("").withOptions({
  history: "replace",
});

function formatUrl(url: string): string {
  try {
    const parsed = new URL(url, "https://example.com");
    return parsed.pathname;
  } catch {
    return url;
  }
}

type SearchPanelProps = {
  locale: Locale;
};

export function SearchPanel({ locale }: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useQueryState("q", queryParser);
  const { results, isLoading, pagefindLoaded, error } = usePagefindSearch(query);
  const pagefindErrorKey = error?.key;
  const t = (ja: string, en: string) => (locale === "en" ? en : ja);

  return (
    <div className="space-y-5">
      <search className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            void setQuery(event.target.value);
          }}
          placeholder={t("キーワードで検索...", "Search by keyword...")}
          aria-label={t("検索キーワード", "Search keyword")}
          disabled={!pagefindLoaded}
          className="h-12 pl-12 pr-14 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1.5 top-1/2 size-11 -translate-y-1/2 rounded-lg"
            aria-label={t("検索をクリア", "Clear search")}
            onClick={() => {
              void setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </search>

      {pagefindErrorKey ? (
        <Card className="border-transparent bg-muted/40 shadow-none">
          <div className="space-y-2 px-4 py-4 text-sm text-muted-foreground">
            <p>
              {pagefindErrorKey === "notLoaded"
                ? t(
                    "検索エンジンがまだ読み込まれていません。しばらく待つか、ページを更新してください。",
                    "Search is not ready yet. Please wait or reload the page.",
                  )
                : pagefindErrorKey === "searchError"
                  ? t("検索中にエラーが発生しました。", "An error occurred while searching.")
                  : pagefindErrorKey === "timeout"
                    ? t(
                        "検索エンジンの読み込みがタイムアウトしました。",
                        "Search loading timed out.",
                      )
                    : t(
                        "検索の読み込みに失敗しました。ページを再読み込みしてください。",
                        "Search could not load. Please reload the page.",
                      )}
            </p>
            <Button type="button" variant="outline" onClick={() => globalThis.location.reload()}>
              {t("再読み込み", "Reload")}
            </Button>
          </div>
        </Card>
      ) : pagefindLoaded ? (
        isLoading ? (
          <output className="block text-sm text-muted-foreground">
            {t("検索中...", "Searching...")}
          </output>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <output className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="bg-muted text-xs text-muted-foreground">
                {locale === "en" ? `${results.length} results` : `${results.length} 件`}
              </Badge>
              <span>{t("検索結果", "Results")}</span>
            </output>
            <ul className="search-results">
              {results.map((result) => (
                <li key={result.url}>
                  <a
                    href={toLocalePath(result.url, locale)}
                    className="index-link flex flex-col gap-2 px-1 py-4"
                  >
                    <h2 className="text-base font-medium">
                      {result.meta.title ?? t("タイトルなし", "Untitled")}
                    </h2>
                    {result.excerpt ? (
                      <div
                        className="text-sm leading-6 text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: result.excerpt }}
                      />
                    ) : null}
                    <span className="text-xs text-muted-foreground">{formatUrl(result.url)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : query.trim() ? (
          <output className="block text-sm text-muted-foreground">
            {t(
              "検索結果が見つかりませんでした。別のキーワードをお試しください。",
              "No results found. Try another keyword.",
            )}
          </output>
        ) : null
      ) : (
        <output className="block text-sm text-muted-foreground">
          {t("検索エンジンを読み込み中...", "Loading search...")}
        </output>
      )}
    </div>
  );
}
