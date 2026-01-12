import type { Metadata } from "next";

type PageProps = {
  params?: { page?: string } | Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const pageNumber = Number(resolvedParams?.page);
  const title = Number.isFinite(pageNumber) ? `Blog Page ${pageNumber}` : "Blog";
  return { title };
}

export { default } from "@/pages/blog/page";
