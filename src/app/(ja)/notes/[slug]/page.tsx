import type { Metadata } from "next";

import NotesDetailPage from "@/pages/notes/detail";
import { getNoteSlugs, getNoteSummary } from "@/entities/note";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const note = await getNoteSummary(slug);
  const title = note?.frontmatter.title || slug;

  return { title };
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getNoteSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageComponentProps = {
  params: Promise<{ slug: string }>;
};

export default function Page(props: PageComponentProps) {
  return <NotesDetailPage {...props} />;
}
