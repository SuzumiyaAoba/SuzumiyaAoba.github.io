import { SiteLayout } from "@/widgets/site-layout";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { SimpleEntryListItem } from "@/shared/ui/simple-entry-list";
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

export function NotesIndexPageContent({
  locale,
  notes,
}: NotesIndexPageContentProps) {
  const pagePath = toLocalePath("/notes", locale);

  const items: SimpleEntryListItem[] = notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    ...(note.date ? { date: note.date } : {}),
    href: toLocalePath(`/notes/${note.slug}`, locale),
  }));

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <SimpleIndexPageContent
        locale={locale}
        path="/notes"
        breadcrumbName="Notes"
        heading={{ ja: "ノート", en: "Notes" }}
        emptyMessage={{
          ja: "まだノートがありません。",
          en: "No notes have been published yet.",
        }}
        items={items}
      />
    </SiteLayout>
  );
}
