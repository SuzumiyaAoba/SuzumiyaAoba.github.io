import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { type SimpleEntryListItem } from "@/shared/ui/simple-entry-list";
import { SimpleIndexPageContent } from "@/shared/ui/simple-index-page-content";

export type NoteListEntry = {
  slug: string;
  title: string;
  date?: string;
};

export type NotesIndexPageContentProps = {
  locale: Locale;
  notes: NoteListEntry[];
};

export function NotesIndexPageContent({ locale, notes }: NotesIndexPageContentProps) {
  const pagePath = toLocalePath("/notes", locale);

  const items: SimpleEntryListItem[] = notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    ...(note.date ? { date: note.date } : {}),
    href: toLocalePath(`/notes/${note.slug}`, locale),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <SimpleIndexPageContent
        locale={locale}
        path="/notes"
        breadcrumbName="Notes"
        heading={{ ja: "ノート", en: "Notes" }}
        description={{
          ja: "読書メモ、設計原則、開発中に残した短い知見をまとめています。",
          en: "A collection of short notes on reading, design principles, and things learned while building.",
        }}
        emptyMessage={{
          ja: "まだノートがありません。",
          en: "No notes have been published yet.",
        }}
        items={items}
      />
      <Footer locale={locale} />
    </div>
  );
}
