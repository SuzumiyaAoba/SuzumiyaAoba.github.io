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
    <footer className="mt-12 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:px-6 md:flex-row md:justify-center">
        <p className="text-xs text-muted-foreground">© {year} SuzumiyaAoba</p>
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <a href={toLocalePath("/contact", locale)} className="hover:text-foreground">
            <I18nText locale={locale} ja="お問い合わせ" en="Contact" />
          </a>
          <a href={toLocalePath("/privacy-policy", locale)} className="hover:text-foreground">
            <I18nText locale={locale} ja="プライバシー" en="Privacy" />
          </a>
          <a href={toLocalePath("/rss.xml", locale)} className="hover:text-foreground">
            RSS
          </a>
        </nav>
      </div>
    </footer>
  );
}
