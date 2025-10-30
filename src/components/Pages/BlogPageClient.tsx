"use client";

import { Timeline } from "@/components/Article/Timeline";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/libs/i18n/client";

type BlogPageClientProps = {
  posts: any[];
  totalPages: number;
  currentPage: number;
  basePath: string;
};

export function BlogPageClient({
  posts,
  totalPages,
  currentPage,
  basePath,
}: BlogPageClientProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language, "common");

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-6 py-10 pb-20">
      <h1 className="mb-10 text-3xl font-bold">{t("pages.blog.title")}</h1>

      <Timeline posts={posts} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={basePath}
      />

      <div className="mt-8">
        <Link
          href="/tags/"
          className="hover:underline text-base"
          style={{ color: "var(--accent-primary)" }}
        >
          {t("pages.blog.showAllTags")} →
        </Link>
      </div>
    </main>
  );
}
