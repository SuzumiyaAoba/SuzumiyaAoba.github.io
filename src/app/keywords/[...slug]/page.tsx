import type { Metadata } from "next";

type PageProps = {
  params?: { slug?: string[] } | Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const title = resolvedParams?.slug?.length
    ? `Keyword: ${resolvedParams.slug.join("/")}`
    : "Keywords";
  return { title };
}

export { default } from "@/pages/keywords/slug";
