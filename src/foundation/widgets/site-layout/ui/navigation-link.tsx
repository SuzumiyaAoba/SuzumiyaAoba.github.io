import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import type { NavigationItem } from "../model/navigation";

type NavigationLinkProps = {
  item: NavigationItem;
  locale: Locale;
  active: boolean;
  index?: boolean;
  onNavigate: () => void;
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
      className={cn(index ? "site-index-link" : "site-nav-link", active && "font-semibold")}
      onClick={onNavigate}
    >
      <span>
        {en ? item.en : item.ja}
        {en && item.japaneseOnly && <small className="site-link-language">JA</small>}
      </span>
      {index && <span aria-hidden="true">↗</span>}
    </a>
  );
}
