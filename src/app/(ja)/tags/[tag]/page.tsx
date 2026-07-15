import {
  buildTagPageMetadata,
  buildTagPageStaticParams,
} from "@/app/_shared/tag-page-metadata";
import TagPage from "@/pages/tags/tag";

export const generateMetadata = buildTagPageMetadata;
export const generateStaticParams = buildTagPageStaticParams;

type PageComponentProps = {
  params: Promise<{ tag: string }>;
};

export default function Page(props: PageComponentProps) {
  return <TagPage {...props} locale="ja" />;
}
