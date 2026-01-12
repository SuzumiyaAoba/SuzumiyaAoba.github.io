import type { Metadata } from "next";

function decodeTag(tag: string): string {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

type PageProps = {
  params?: { tag?: string } | Promise<{ tag?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const tagParam = resolvedParams?.tag;
  if (!tagParam) {
    return { title: "Tags" };
  }
  const tag = decodeTag(tagParam);
  return { title: `Tag: ${tag}` };
}

export { default } from "@/pages/tags/tag";
