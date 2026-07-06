import { cn } from "@/shared/lib/utils";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import type { BookChapter } from "@/entities/book";

type BookNavProps = {
  locale: Locale;
  bookSlug: string;
  bookTitle: string;
  chapters: BookChapter[];
  currentChapter: string;
  currentSection: string;
};

export function BookNav({
  locale,
  bookSlug,
  bookTitle,
  chapters,
  currentChapter,
  currentSection,
}: BookNavProps) {
  return (
    <nav aria-label="書籍ナビゲーション" className="space-y-4">
      <a
        href={toLocalePath(`/books/${bookSlug}`, locale)}
        className="block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors"
      >
        {bookTitle}
      </a>
      <div className="space-y-4">
        {chapters.map((ch) => (
          <section key={ch.chapter} className="space-y-1">
            <p className="text-xs font-semibold text-foreground/70">
              第{parseInt(ch.chapter, 10)}章 — {ch.title}
            </p>
            <ol className="space-y-1">
              {ch.sections.map((sec) => {
                const isCurrent =
                  sec.chapter === currentChapter && sec.section === currentSection;
                return (
                  <li key={`${sec.chapter}-${sec.section}`}>
                    <a
                      href={toLocalePath(
                        `/books/${bookSlug}/${sec.chapter}/${sec.section}`,
                        locale,
                      )}
                      className={cn(
                        "block rounded px-2 py-0.5 text-sm transition-colors",
                        isCurrent
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {sec.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </nav>
  );
}
