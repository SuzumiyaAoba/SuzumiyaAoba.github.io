"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import type { AwesomeItem, AwesomeLink } from "../model/awesome-item";
import type { Locale } from "@/shared/lib/routing";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

function ResourceLink({ url, children }: { url: string; children: ReactNode }) {
  const external = !url.startsWith("/");
  return (
    <a
      href={url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-block min-h-8 break-words py-1 text-sm underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
    >
      {children}
      {external && <span aria-hidden="true"> ↗</span>}
    </a>
  );
}

function ArticleLinks({ title, links }: { title: string; links: AwesomeLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2 text-muted-foreground">
        {links.map((link, index) => (
          <li key={`${link.url}-${index}`}>
            <ResourceLink url={link.url}>{link.title ?? link.url}</ResourceLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AwesomeList({ locale, items }: { locale: Locale; items: AwesomeItem[] }) {
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const isEnglish = locale === "en";
  const hasFilters = query.length > 0 || category !== null;
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase(locale);
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const categories = new Map<string, number>();
  for (const item of items) {
    categories.set(item.category, (categories.get(item.category) ?? 0) + 1);
  }
  const filteredItems = items.filter((item) => {
    if (category !== null && item.category !== category) return false;
    const text = normalize([item.name, item.category, item.description].join(" "));
    return terms.every((term) => text.includes(term));
  });

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-muted/60 px-6 py-12 text-center text-sm text-muted-foreground">
        {isEnglish ? "No discoveries recorded yet." : "まだ登録がありません。"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl bg-muted/60 p-5 sm:p-7" data-pagefind-ignore>
        <search className="relative max-w-xl">
          <label htmlFor={searchId} className="sr-only">
            {isEnglish ? "Search by name, description, or category" : "名称・説明・カテゴリで検索"}
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isEnglish ? "Search by name or category…" : "名称・カテゴリで検索…"}
            className="h-12 bg-background pl-10"
          />
        </search>
        <div
          role="group"
          aria-label={isEnglish ? "Filter by category" : "カテゴリで絞り込み"}
          className="flex flex-wrap gap-2"
        >
          <Button
            type="button"
            variant={category === null ? "default" : "outline"}
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
            className="h-auto min-h-11 whitespace-normal rounded-lg shadow-none"
          >
            {isEnglish ? "All" : "すべて"}
            <span className="text-xs tabular-nums opacity-75">{items.length}</span>
          </Button>
          {Array.from(categories, ([name, count]) => (
            <Button
              key={name}
              type="button"
              variant={category === name ? "default" : "outline"}
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className="h-auto min-h-11 max-w-full whitespace-normal rounded-lg shadow-none"
            >
              {name}
              <span className="text-xs tabular-nums opacity-75">{count}</span>
            </Button>
          ))}
        </div>
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-3">
          <output className="text-sm tabular-nums text-muted-foreground">
            {isEnglish
              ? `${filteredItems.length} of ${items.length} items`
              : `${items.length} 件中 ${filteredItems.length} 件を表示`}
          </output>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-2"
              onClick={() => {
                setQuery("");
                setCategory(null);
                inputRef.current?.focus();
              }}
            >
              <X className="size-4" aria-hidden="true" />
              {isEnglish ? "Clear filters" : "絞り込みを解除"}
            </Button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="space-y-4 rounded-xl bg-muted/60 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isEnglish ? "No matching discoveries." : "条件に一致する項目がありません。"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              id={`awesome-${item.id}`}
              aria-labelledby={`awesome-${item.id}-title`}
              className="min-w-0 scroll-mt-24 space-y-5 rounded-xl bg-muted/50 p-6 transition-colors hover:bg-muted sm:p-8"
            >
              <div className="space-y-3">
                <Badge variant="secondary" className="font-normal text-muted-foreground">
                  {item.category}
                </Badge>
                <h2
                  id={`awesome-${item.id}-title`}
                  className="text-xl font-semibold tracking-tight"
                >
                  {item.name}
                </h2>
                <p className="whitespace-pre-line text-sm leading-7 text-foreground/80">
                  {item.description}
                </p>
              </div>
              {(item.websiteUrl || item.githubUrl) && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3">
                  {item.websiteUrl && (
                    <ResourceLink url={item.websiteUrl}>
                      {isEnglish ? "Official website" : "公式サイト"}
                    </ResourceLink>
                  )}
                  {item.githubUrl && <ResourceLink url={item.githubUrl}>GitHub</ResourceLink>}
                </div>
              )}
              <ArticleLinks title={isEnglish ? "Articles" : "紹介記事"} links={item.articles} />
              <ArticleLinks
                title={isEnglish ? "Related posts on this site" : "サイト内の関連記事"}
                links={item.relatedPosts}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
