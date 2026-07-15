import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

export type BackLinkProps = {
  locale: Locale;
  /** ロケール非依存のパス(例: "/notes") */
  href: string;
  ja: string;
  en: string;
  className?: string;
};

/**
 * 「← 一覧に戻る」系のリンク。detail系ページで反復していたマークアップを共通化する。
 */
export function BackLink({ locale, href, ja, en, className }: BackLinkProps) {
  return (
    <a
      href={toLocalePath(href, locale)}
      className={className ?? "text-xs font-medium text-muted-foreground"}
    >
      <I18nText locale={locale} ja={ja} en={en} />
    </a>
  );
}
