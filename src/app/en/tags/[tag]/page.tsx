import TagPage from "@/pages/tags/tag";

type PageProps = {
  params: Promise<{ tag: string }>;
};

export default function Page(props: PageProps) {
  return <TagPage {...props} locale="en" />;
}
export * from "../../../tags/[tag]/page";
export * from "../../../tags/[tag]/page";
