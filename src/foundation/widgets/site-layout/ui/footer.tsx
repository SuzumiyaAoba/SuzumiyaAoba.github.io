import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site";
import { navigationGroups } from "../model/navigation";
import { BrandMark } from "./brand-mark";
import { NavigationLink } from "./navigation-link";

/**
 * Footer コンポーネントのプロップス
 */
type FooterProps = {
  /** 現在のロケール */
  locale: Locale;
};

/**
 * サイトのフッター。全ページへの地図（サイトマップ）を兼ね、どこに何があるかを一望できるようにする。
 * @param props ロケール情報
 */
export function Footer({ locale }: FooterProps) {
  const year = new Date().getFullYear();
  const en = locale === "en";

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer-grid">
          <div>
            <a
              href={toLocalePath("/", locale)}
              className="site-footer-brand"
              aria-label={`${SITE_TITLE} — ${en ? "Home" : "ホーム"}`}
            >
              <BrandMark />
              <span lang="la">{SITE_TITLE}</span>
            </a>
          </div>
          <nav
            aria-label={en ? "Sitemap" : "サイトマップ"}
            className="site-footer-nav"
          >
            {navigationGroups.map((group) => (
              <div key={group.en}>
                <p className="site-footer-heading">
                  {en ? group.en : group.ja}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavigationLink
                        item={item}
                        locale={locale}
                        active={false}
                        index
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="site-footer-bottom">
          <p>© {year} SuzumiyaAoba</p>
          <a href="#top" className="site-footer-top">
            {en ? "Back to top" : "ページの先頭へ"}
            <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
