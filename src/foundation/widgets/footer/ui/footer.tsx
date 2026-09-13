import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

/**
 * Footer コンポーネントのプロップス
 */
type FooterProps = {
  /** 現在のロケール */
  locale: Locale;
};

/**
 * サイトのフッターを表示するコンポーネント
 * @param props ロケール情報
 */
export function Footer({ locale }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="eyebrow text-muted-foreground">© {year} SuzumiyaAoba</p>
          <nav
            aria-label={locale === "en" ? "Footer navigation" : "フッターナビゲーション"}
            className="font-noto flex flex-wrap gap-x-5 text-xs text-muted-foreground"
          >
            <a
              href={toLocalePath("/contact", locale)}
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
            >
              <I18nText locale={locale} ja="お問い合わせ" en="Contact" />
            </a>
            <a
              href={toLocalePath("/privacy-policy", locale)}
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
            >
              <I18nText locale={locale} ja="プライバシー" en="Privacy" />
            </a>
            <a
              href={toLocalePath("/rss.xml", locale)}
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
            >
              RSS
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
