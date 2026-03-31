import { getNoteSummariesVariants } from "@/entities/note";
import { type Locale } from "@/shared/lib/routing";
import { NotesIndexPageContent, type NoteListEntry } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const notes = await getNoteSummariesVariants();

  const entries = notes
    .map((variant): NoteListEntry | null => {
      const note =
        resolvedLocale === "ja" ? (variant.ja ?? variant.en) : (variant.en ?? variant.ja);
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
