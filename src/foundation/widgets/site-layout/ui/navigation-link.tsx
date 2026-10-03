import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { NavigationItem } from "../model/navigation";

type NavigationLinkProps = {
  item: NavigationItem;
  locale: Locale;
  active: boolean;
  index?: boolean;
  onNavigate?: () => void;
};

export function NavigationLink({
  item,
  locale,
  active,
  index = false,
  onNavigate,
}: NavigationLinkProps) {
  const en = locale === "en";
  return (
    <a
      href={toLocalePath(item.href, item.japaneseOnly ? "ja" : locale)}
      hrefLang={item.japaneseOnly ? "ja" : undefined}
      aria-current={active ? "page" : undefined}
      className={index ? "site-index-link" : "site-nav-link"}
      onClick={onNavigate}
    >
      {en ? item.en : item.ja}
      {en && item.japaneseOnly && (
        <small className="site-link-language">JA</small>
      )}
    </a>
  );
}
