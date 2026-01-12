import { notFound } from "next/navigation";
import { parseMarkdown } from "@/shared/lib/markdown";
import { getPostBySlug, getPostSlugs } from "@/entities/post";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const html = await parseMarkdown(post.content);

  return (
    <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
      <article className="space-y-6">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}
