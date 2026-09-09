"use client";

import { parseAsString, useQueryState } from "nuqs";

import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
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
  const [query, setQuery] = useQueryState("q", queryParser);
  const { results, isLoading, pagefindLoaded, error } = usePagefindSearch(query);
  const pagefindErrorKey = error?.key;
  const pagefindErrorDetail = error?.detail ?? "";
  const t = (ja: string, en: string) => (locale === "en" ? en : ja);

  return (
    <div className="space-y-6">
      <Card className="border-transparent bg-card/40 shadow-none">
        <div className="px-4 py-4">
          <Input
            value={query}
            onChange={(event) => void setQuery(event.target.value)}
            placeholder={t("キーワードで検索...", "Search by keyword...")}
            aria-label={t("検索キーワード", "Search keyword")}
            disabled={!pagefindLoaded}
          />
        </div>
      </Card>

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
                        `検索エンジンの読み込みに失敗しました。${pagefindErrorDetail}`.trim(),
                        `Failed to load search.${pagefindErrorDetail ? ` ${pagefindErrorDetail}` : ""}`.trim(),
                      )}
            </p>
            <p className="text-xs">
              {t(
                "ビルド後に Pagefind を実行していない場合は、検索インデックスが生成されていない可能性があります。",
                "If Pagefind hasn’t been run after build, the search index might be missing.",
              )}
            </p>
          </div>
        </Card>
      ) : !pagefindLoaded ? (
        <div className="text-sm text-muted-foreground">
          {t("検索エンジンを読み込み中...", "Loading search...")}
        </div>
      ) : isLoading ? (
        <div className="text-sm text-muted-foreground">{t("検索中...", "Searching...")}</div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="bg-muted text-xs text-muted-foreground">
              {locale === "en" ? `${results.length} results` : `${results.length} 件`}
            </Badge>
            <span>{t("検索結果", "Results")}</span>
          </div>
          <ul className="space-y-4">
            {results.map((result) => (
              <li key={result.url}>
                <Card className="border-transparent bg-card/40 shadow-none">
                  <a
                    href={toLocalePath(result.url, locale)}
                    className="flex flex-col gap-2 px-5 py-5 transition-colors hover:text-foreground/80"
                  >
                    <h2 className="text-base font-semibold text-foreground">
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
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : query.trim() ? (
        <div className="text-sm text-muted-foreground">
          {t(
            "検索結果が見つかりませんでした。別のキーワードをお試しください。",
            "No results found. Try another keyword.",
          )}
        </div>
      ) : null}
    </div>
  );
}
