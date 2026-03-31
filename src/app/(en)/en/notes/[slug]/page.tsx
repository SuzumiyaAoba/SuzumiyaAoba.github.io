import type { Metadata } from "next";

import { getNoteSlugs, getNoteSummaryVariants } from "@/entities/note";
import NotesDetailPage from "@/pages/notes/detail";
import { toLocalePath } from "@/shared/lib/routing";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const { ja: noteJa, en: noteEn } = await getNoteSummaryVariants(slug);
  const note = noteEn ?? noteJa;
  if (!note) {
    return { title: "Notes" };
  }

  const title = note.frontmatter.title || slug;
  const canonicalPath = noteEn
    ? toLocalePath(`/notes/${slug}`, "en")
    : toLocalePath(`/notes/${slug}`, "ja");

  return {
    title,
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getNoteSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageComponentProps = {
  params: Promise<{ slug: string }>;
};

export default function Page(props: PageComponentProps) {
  return <NotesDetailPage {...props} locale="en" />;
}
