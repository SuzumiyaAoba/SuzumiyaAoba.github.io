import { resolveLocalizedValue, resolveLocale, type Locale } from "@/shared/lib/routing";
import { getNoteSummariesVariants } from "@/entities/note";
import { NotesIndexPageContent, type NoteListEntry } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const notes = await getNoteSummariesVariants();

  const entries = notes
    .map((variant): NoteListEntry | null => {
      const note = resolveLocalizedValue(variant, resolvedLocale);
      if (!note) {
        return null;
      }

      return {
        slug: variant.slug,
        title: note.frontmatter.title || variant.slug,
        ...(note.frontmatter.date ? { date: note.frontmatter.date } : {}),
      };
    })
    .filter((entry): entry is NoteListEntry => Boolean(entry));

  return <NotesIndexPageContent locale={resolvedLocale} notes={entries} />;
}
