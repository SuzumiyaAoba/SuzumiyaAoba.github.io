import { getPostSlugs } from "../lib";
import { type Locale } from "@/shared/lib/routing";
import { PostsIndexPageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const slugs = await getPostSlugs();

  return <PostsIndexPageContent locale={resolvedLocale} slugs={slugs} />;
}
