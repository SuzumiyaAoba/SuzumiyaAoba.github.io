import type { Metadata } from "next";

import { getNoteSlugs } from "@/entities/note";
import NotesDetailPage from "@/pages/notes/detail";
import { buildNotesPageMetadata } from "@/app/_shared/notes-page-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildNotesPageMetadata(slug, "en");
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
