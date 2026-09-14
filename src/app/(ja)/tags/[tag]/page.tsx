import type { Metadata } from "next";
import { buildTagPageMetadata } from "@/app/_shared/tag-page-metadata";
import type { TagPageMetadataProps } from "@/app/_shared/tag-page-metadata";
import TagPage from "@/pages/tags/tag";

export { buildTagPageStaticParams as generateStaticParams } from "@/app/_shared/tag-page-metadata";

export async function generateMetadata(props: TagPageMetadataProps): Promise<Metadata> {
  return buildTagPageMetadata(props, "ja");
}

type PageComponentProps = {
  params: Promise<{ tag: string }>;
};

export default function Page(props: PageComponentProps) {
  return <TagPage {...props} locale="ja" />;
}
