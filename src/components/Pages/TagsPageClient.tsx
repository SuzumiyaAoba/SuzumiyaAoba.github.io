"use client";

import { Tag } from "@/components/Tag";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/libs/i18n/client";

type TagsPageClientProps = {
  sortedTags: [string, number][];
};

export function TagsPageClient({ sortedTags }: TagsPageClientProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language, "common");

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">{t("pages.tags.title")}</h1>
      <div className="flex flex-wrap gap-4 mb-8">
        {sortedTags.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}/`}
            className="flex items-center gap-2"
          >
            <Tag label={tag} size="md" />
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              ({count})
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
