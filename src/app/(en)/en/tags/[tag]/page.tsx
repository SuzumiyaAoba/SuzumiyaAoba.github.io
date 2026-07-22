import type { Metadata } from "next";
import {
  buildTagPageMetadata,
  buildTagPageStaticParams,
  type TagPageMetadataProps,
} from "@/app/_shared/tag-page-metadata";
import TagPage from "@/pages/tags/tag";

export async function generateMetadata(props: TagPageMetadataProps): Promise<Metadata> {
  return buildTagPageMetadata(props, "en");
}
export const generateStaticParams = buildTagPageStaticParams;

type PageComponentProps = {
  params: Promise<{ tag: string }>;
};

export default function Page(props: PageComponentProps) {
  return <TagPage {...props} locale="en" />;
}
