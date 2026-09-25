"use client";

import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import type { AwesomeItem, AwesomeLink } from "../model/awesome-item";
import {
  getAwesomeCatalog,
  getAwesomeSearchText,
} from "../model/awesome-catalog";
import { getAwesomePath } from "../model/awesome-categories";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Input } from "@/shared/ui/input";
import { Tag } from "@/shared/ui/tag";
import { CategoryIcon } from "./category-icon";

function ResourceLink({ url, children }: { url: string; children: ReactNode }) {
  const external = !url.startsWith("/");
  return (
    <a
      href={url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-block min-h-8 py-1 text-sm break-words text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
    >
      {children}
      {external && <span aria-hidden="true"> ↗</span>}
    </a>
  );
}

function ArticleLinks({
  title,
  links,
}: {
  title: string;
  links: AwesomeLink[];
}) {
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

export function AwesomeList({
  locale,
  items,
  groupBy = "category",
  showCategoryFilters = true,
}: {
  locale: Locale;
  items: AwesomeItem[];
  groupBy?: "category" | "subcategory";
  showCategoryFilters?: boolean;
}) {
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const isEnglish = locale === "en";
  const hasFilters =
    query.length > 0 || category !== null || selectedTag !== null;
  const normalize = (value: string) =>
    value.normalize("NFKC").toLocaleLowerCase(locale);
  const terms = normalize(query).trim().split(/\s+/u).filter(Boolean);
  const categories = getAwesomeCatalog(items).flatMap((entry) => {
    const categoryItems = items.filter((item) => item.category === entry.id);
    return groupBy === "subcategory"
      ? entry.subcategories.map((subcategory) => ({
          id: `${entry.id}/${subcategory.id}`,
          name: subcategory.name[locale],
          categoryId: entry.id,
          path: getAwesomePath(entry.id, subcategory.id),
          items: categoryItems.filter(
            (item) => item.subcategory === subcategory.id
          ),
        }))
      : [
          {
            id: entry.id,
            name: entry.name[locale],
            categoryId: entry.id,
            path: getAwesomePath(entry.id),
            items: categoryItems,
          },
        ];
  });
  const filteredGroups = categories
    .filter((group) => category === null || group.id === category)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (selectedTag !== null && !item.tags.includes(selectedTag)) {
          return false;
        }
        const text = normalize(getAwesomeSearchText(item));
        return terms.every((term) => text.includes(term));
      }),
    }))
    .filter((group) => group.items.length > 0);
  const filteredCount = filteredGroups.reduce(
    (count, group) => count + group.items.length,
    0
  );

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
              className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              id={searchId}
              type="search"
              variant="underline"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isEnglish
                  ? "Search by name, category, or tag…"
                  : "名称・カテゴリ・タグで検索…"
              }
            />
          </search>
          <div className={hasFilters ? "flex items-center gap-4" : "sr-only"}>
            <output className="text-xs text-muted-foreground tabular-nums">
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
        {showCategoryFilters && (
          <fieldset
            aria-label={isEnglish ? "Filter by category" : "カテゴリで絞り込み"}
            className="flex min-w-0 flex-wrap gap-x-5"
          >
            <button
              type="button"
              aria-pressed={category === null}
              onClick={() => setCategory(null)}
              className="inline-flex min-h-11 items-center gap-1.5 py-2 text-sm text-muted-foreground underline-offset-8 transition-colors hover:text-foreground aria-pressed:text-foreground aria-pressed:underline"
            >
              <CategoryIcon />
              {isEnglish ? "All" : "すべて"}
            </button>
            {categories.map(({ id, name, categoryId }) => (
              <button
                key={id}
                type="button"
                aria-pressed={category === id}
                onClick={() => setCategory(id)}
                className="inline-flex min-h-11 max-w-full items-center gap-1.5 py-2 text-left text-sm text-muted-foreground underline-offset-8 transition-colors hover:text-foreground aria-pressed:text-foreground aria-pressed:underline"
              >
                <CategoryIcon category={categoryId} />
                <span className="min-w-0 break-words">{name}</span>
              </button>
            ))}
          </fieldset>
        )}
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
              className="inline-flex min-h-9 min-w-0 items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-left text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Tag tag={selectedTag} variant="bare" className="min-w-0" />
              <X className="size-3.5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {filteredCount === 0 ? (
        <p className="border-t border-border py-8 text-sm text-muted-foreground">
          {isEnglish
            ? "No matching discoveries."
            : "条件に一致する項目がありません。"}
        </p>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map(
            ({ id, name, categoryId, path, items: categoryItems }) => {
              const headingId = `awesome-category-${encodeURIComponent(id)}`;

              return (
                <section
                  key={id}
                  aria-labelledby={headingId}
                  className="grid gap-4 border-t border-border pt-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-8 lg:grid-cols-[12rem_minmax(0,1fr)]"
                >
                  <div className="flex items-baseline gap-3">
                    <h2
                      id={headingId}
                      className="flex min-w-0 items-center gap-2 text-sm leading-7 font-medium"
                    >
                      <CategoryIcon category={categoryId} />
                      <Link
                        href={toLocalePath(path, locale)}
                        className="min-w-0 break-words underline-offset-4 hover:underline"
                      >
                        {name}
                      </Link>
                    </h2>
                    <span
                      className="text-xs text-muted-foreground tabular-nums"
                      data-pagefind-ignore
                    >
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
                              className="min-w-0 text-base leading-7 font-semibold tracking-tight break-words"
                            >
                              {item.name}
                            </h3>
                            {(item.websiteUrl || item.githubUrl) && (
                              <div className="flex flex-wrap gap-x-4">
                                {item.websiteUrl && (
                                  <ResourceLink url={item.websiteUrl}>
                                    {isEnglish
                                      ? "Official website"
                                      : "公式サイト"}
                                  </ResourceLink>
                                )}
                                {item.githubUrl && (
                                  <ResourceLink url={item.githubUrl}>
                                    GitHub
                                  </ResourceLink>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-sm leading-7 break-words whitespace-pre-line text-muted-foreground">
                            {item.description}
                          </p>
                          {item.tags.length > 0 && (
                            <ul
                              aria-label={isEnglish ? "Tags" : "タグ"}
                              className="flex flex-wrap gap-2"
                            >
                              {item.tags.map((tag) => (
                                <li key={tag} className="max-w-full min-w-0">
                                  <button
                                    type="button"
                                    aria-pressed={selectedTag === tag}
                                    onClick={() =>
                                      setSelectedTag((current) =>
                                        current === tag ? null : tag
                                      )
                                    }
                                    className="group inline-flex min-h-9 max-w-full items-center rounded-full text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                  >
                                    <Tag
                                      tag={tag}
                                      variant="toggle"
                                      className="max-w-full"
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
                            title={
                              isEnglish
                                ? "Related posts on this site"
                                : "サイト内の関連記事"
                            }
                            links={item.relatedPosts}
                          />
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
