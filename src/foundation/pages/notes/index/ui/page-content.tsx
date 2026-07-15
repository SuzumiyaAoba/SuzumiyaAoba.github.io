import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { Card } from "@/shared/ui/card";
import { SimpleEntryList, type SimpleEntryListItem } from "@/shared/ui/simple-entry-list";

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
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Notes", path: pagePath },
        ])}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="ノート" en="Notes" />
          </h1>
          <div className="max-w-3xl space-y-3">
            <p className="text-sm leading-7 text-muted-foreground">
              <I18nText
                locale={locale}
                ja="読書メモ、設計原則、開発中に残した短い知見をまとめています。"
                en="A collection of short notes on reading, design principles, and things learned while building."
              />
            </p>
          </div>
        </section>

        <SimpleEntryList
          items={items}
          emptyState={
            <Card className="border-transparent bg-card/40 shadow-none">
              <div className="px-5 py-6 text-sm text-muted-foreground">
                <I18nText
                  locale={locale}
                  ja="まだノートがありません。"
                  en="No notes have been published yet."
                />
              </div>
            </Card>
          }
        />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
