import { getPostSlugs } from "../lib";
import { resolveLocale, type Locale } from "@/shared/lib/routing";
import { PostsIndexPageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const slugs = await getPostSlugs();

  return <PostsIndexPageContent locale={resolvedLocale} slugs={slugs} />;
}
