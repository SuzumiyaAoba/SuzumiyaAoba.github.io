import { getAwesomeItems } from "../model/awesome-items";
import { resolveLocale } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { AwesomeSomethingPageContent } from "./page-content";

export default async function Page({ locale }: { locale?: Locale }) {
  const items = await getAwesomeItems();
  return (
    <AwesomeSomethingPageContent locale={resolveLocale(locale)} items={items} />
  );
}
