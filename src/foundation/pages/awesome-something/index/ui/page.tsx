import { getAwesomeItems } from "../model/awesome-items";
import { resolveLocale, type Locale } from "@/shared/lib/routing";
import { AwesomeSomethingPageContent } from "./page-content";

export default async function Page({ locale }: { locale?: Locale }) {
  const items = await getAwesomeItems();
  return <AwesomeSomethingPageContent locale={resolveLocale(locale)} items={items} />;
}
