"use client";

import { useId, useState, type ReactNode } from "react";
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
      className="break-words text-sm underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const isEnglish = locale === "en";
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
      <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        {isEnglish ? "No discoveries recorded yet." : "まだ登録がありません。"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4" data-pagefind-ignore>
        <search className="max-w-lg space-y-2">
          <label htmlFor={searchId} className="text-sm font-medium">
            {isEnglish ? "Search by name, description, or category" : "名称・説明・カテゴリで検索"}
          </label>
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isEnglish ? "Search discoveries…" : "キーワードを入力…"}
            className="h-11"
          />
        </search>
        <div
          role="group"
          aria-label={isEnglish ? "Filter by category" : "カテゴリで絞り込み"}
          className="flex flex-wrap gap-2"
        >
          <Button
            type="button"
            variant={category === null ? "secondary" : "ghost"}
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
            className="h-auto min-h-10 whitespace-normal rounded-full"
          >
            {isEnglish ? "All" : "すべて"}
            <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
          </Button>
          {Array.from(categories, ([name, count]) => (
            <Button
              key={name}
              type="button"
              variant={category === name ? "secondary" : "ghost"}
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className="h-auto min-h-10 max-w-full whitespace-normal rounded-full"
            >
              {name}
              <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
            </Button>
          ))}
        </div>
        <p role="status" className="text-xs tabular-nums text-muted-foreground">
          {isEnglish
            ? `${filteredItems.length} of ${items.length} items`
            : `${items.length} 件中 ${filteredItems.length} 件を表示`}
        </p>
      </div>

      {filteredItems.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isEnglish ? "No matching discoveries." : "条件に一致する項目がありません。"}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuery("");
              setCategory(null);
            }}
          >
            {isEnglish ? "Clear filters" : "絞り込みを解除"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              id={`awesome-${item.id}`}
              aria-labelledby={`awesome-${item.id}-title`}
              className="min-w-0 scroll-mt-24 space-y-5 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6"
            >
              <div className="space-y-3">
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {item.category}
                </Badge>
                <h2
                  id={`awesome-${item.id}-title`}
                  className="text-xl font-semibold tracking-tight"
                >
                  {item.name}
                </h2>
                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {(item.websiteUrl || item.githubUrl) && (
                <div className="flex flex-wrap gap-x-5 gap-y-2">
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
