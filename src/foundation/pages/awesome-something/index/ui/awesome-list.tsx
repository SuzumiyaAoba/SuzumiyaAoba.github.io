"use client";

import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import type { AwesomeItem, AwesomeLink } from "../model/awesome-item";
import type { Locale } from "@/shared/lib/routing";
import { Input } from "@/shared/ui/input";
import { Tag } from "@/shared/ui/tag";

function ResourceLink({ url, children }: { url: string; children: ReactNode }) {
  const external = !url.startsWith("/");
  return (
    <a
      href={url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-block min-h-8 break-words py-1 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
    >
      {children}
      {external && <span aria-hidden="true"> ↗</span>}
    </a>
  );
}

function ArticleLinks({ title, links }: { title: string; links: AwesomeLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-x-4 sm:flex-row sm:items-baseline">
      <h4 className="shrink-0 text-xs text-muted-foreground">{title}</h4>
      <ul className="min-w-0 space-y-1">
        {links.map((link) => (
          <li key={link.url}>
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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const isEnglish = locale === "en";
  const hasFilters = query.length > 0 || category !== null || selectedTag !== null;
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase(locale);
  const terms = normalize(query).trim().split(/\s+/u).filter(Boolean);
  const categories = new Map<string, AwesomeItem[]>();
  for (const item of items) {
    const categoryItems = categories.get(item.category);
    if (categoryItems) {
      categoryItems.push(item);
    } else {
      categories.set(item.category, [item]);
    }
  }
  const filteredGroups = [...categories]
    .filter(([name]) => category === null || name === category)
    .map(([name, categoryItems]) => ({
      name,
      items: categoryItems.filter((item) => {
        if (selectedTag !== null && !item.tags.includes(selectedTag)) {
          return false;
        }
        const text = normalize(
          [item.name, item.category, ...item.tags, item.description].join(" "),
        );
        return terms.every((term) => text.includes(term));
      }),
    }))
    .filter((group) => group.items.length > 0);
  const filteredCount = filteredGroups.reduce((count, group) => count + group.items.length, 0);

  if (items.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        {isEnglish ? "No discoveries recorded yet." : "まだ登録がありません。"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2" data-pagefind-ignore>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <search className="relative w-full sm:max-w-sm">
            <label htmlFor={searchId} className="sr-only">
              {isEnglish
                ? "Search by name, description, category, or tag"
                : "名称・説明・カテゴリ・タグで検索"}
            </label>
            <Search
              className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isEnglish ? "Search by name, category, or tag…" : "名称・カテゴリ・タグで検索…"
              }
              className="rounded-none border-0 border-b border-border bg-transparent pl-7 focus-visible:border-ring focus-visible:ring-0"
            />
          </search>
          <div className={hasFilters ? "flex items-center gap-4" : "sr-only"}>
            <output className="text-xs tabular-nums text-muted-foreground">
              {isEnglish
                ? `${filteredCount} of ${items.length} items`
                : `${items.length} 件中 ${filteredCount} 件を表示`}
            </output>
            {hasFilters && (
              <button
                type="button"
                className="min-h-11 text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                onClick={() => {
                  setQuery("");
                  setCategory(null);
                  setSelectedTag(null);
                  inputRef.current?.focus();
                }}
              >
                {isEnglish ? "Clear filters" : "絞り込みを解除"}
              </button>
            )}
          </div>
        </div>
        <fieldset
          aria-label={isEnglish ? "Filter by category" : "カテゴリで絞り込み"}
          className="flex min-w-0 flex-wrap gap-x-5"
        >
          <button
            type="button"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
            className="min-h-11 py-2 text-sm text-muted-foreground underline-offset-8 transition-colors hover:text-foreground aria-pressed:text-foreground aria-pressed:underline"
          >
            {isEnglish ? "All" : "すべて"}
          </button>
          {Array.from(categories.keys(), (name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className="min-h-11 max-w-full break-words py-2 text-left text-sm text-muted-foreground underline-offset-8 transition-colors hover:text-foreground aria-pressed:text-foreground aria-pressed:underline"
            >
              {name}
            </button>
          ))}
        </fieldset>
        {selectedTag !== null && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="shrink-0">{isEnglish ? "Tag:" : "タグ:"}</span>
            <button
              type="button"
              aria-label={
                isEnglish
                  ? `Clear tag filter: ${selectedTag}`
                  : `タグ「${selectedTag}」の絞り込みを解除`
              }
              onClick={() => setSelectedTag(null)}
              className="inline-flex min-h-9 min-w-0 items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-left text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 break-words">{selectedTag}</span>
              <X className="size-3.5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {filteredCount === 0 ? (
        <p className="border-t border-border py-8 text-sm text-muted-foreground">
          {isEnglish ? "No matching discoveries." : "条件に一致する項目がありません。"}
        </p>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map(({ name, items: categoryItems }) => {
            const headingId = `awesome-category-${encodeURIComponent(name)}`;

            return (
              <section
                key={name}
                aria-labelledby={headingId}
                className="grid gap-4 border-t border-border pt-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-8 lg:grid-cols-[12rem_minmax(0,1fr)]"
              >
                <div className="flex items-baseline gap-3">
                  <h2 id={headingId} className="min-w-0 break-words text-sm font-medium leading-7">
                    {name}
                  </h2>
                  <span className="text-xs tabular-nums text-muted-foreground" data-pagefind-ignore>
                    {categoryItems.length}
                  </span>
                </div>
                <ul className="min-w-0 divide-y divide-border/60">
                  {categoryItems.map((item) => (
                    <li key={item.id} className="py-5 first:pt-0 last:pb-0">
                      <article
                        id={`awesome-${item.id}`}
                        aria-labelledby={`awesome-${item.id}-title`}
                        className="min-w-0 scroll-mt-24 space-y-2"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                          <h3
                            id={`awesome-${item.id}-title`}
                            className="min-w-0 break-words text-base font-semibold leading-7 tracking-tight"
                          >
                            {item.name}
                          </h3>
                          {(item.websiteUrl || item.githubUrl) && (
                            <div className="flex flex-wrap gap-x-4">
                              {item.websiteUrl && (
                                <ResourceLink url={item.websiteUrl}>
                                  {isEnglish ? "Official website" : "公式サイト"}
                                </ResourceLink>
                              )}
                              {item.githubUrl && (
                                <ResourceLink url={item.githubUrl}>GitHub</ResourceLink>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                          {item.description}
                        </p>
                        {item.tags.length > 0 && (
                          <ul
                            aria-label={isEnglish ? "Tags" : "タグ"}
                            className="flex flex-wrap gap-2"
                          >
                            {item.tags.map((tag) => (
                              <li key={tag} className="min-w-0 max-w-full">
                                <button
                                  type="button"
                                  aria-pressed={selectedTag === tag}
                                  onClick={() =>
                                    setSelectedTag((current) => (current === tag ? null : tag))
                                  }
                                  className="group inline-flex min-h-9 max-w-full items-center rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <Tag
                                    tag={tag}
                                    className="max-w-full bg-muted py-1 text-[11px] font-medium text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground group-aria-pressed:bg-foreground group-aria-pressed:text-background [&>span]:min-w-0 [&>span]:break-words"
                                  />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <ArticleLinks
                          title={isEnglish ? "Articles" : "紹介記事"}
                          links={item.articles}
                        />
                        <ArticleLinks
                          title={isEnglish ? "Related posts on this site" : "サイト内の関連記事"}
                          links={item.relatedPosts}
                        />
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
