import { AwesomeCategoryPage } from "@/pages/awesome-something/index";
import { buildAwesomeCategoryMetadata } from "@/app/_shared/awesome-category-page";
import type { AwesomeCategoryPageProps } from "@/app/_shared/awesome-category-page";

export { buildAwesomeCategoryStaticParams as generateStaticParams } from "@/app/_shared/awesome-category-page";

export async function generateMetadata(props: AwesomeCategoryPageProps) {
  return await buildAwesomeCategoryMetadata(props, "ja");
}

export default function Page(props: AwesomeCategoryPageProps) {
  return <AwesomeCategoryPage {...props} locale="ja" />;
}
