import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

type PageProps = {
  locale?: Locale;
};

export default function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const isEn = resolvedLocale === "en";
  const pagePath = toLocalePath("/privacy-policy", resolvedLocale);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Privacy", path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="プライバシー" en="Privacy Policy" />
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            <I18nText locale={resolvedLocale} ja="プライバシーポリシー" en="Privacy Policy" />
          </h1>
        </section>

        <section className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              <I18nText locale={resolvedLocale} ja="個人情報の利用目的" en="Purpose of Personal Data Use" />
            </h2>
            {isEn ? (
              <>
                <p>
                  We use personal information collected from visitors (such as names and email
                  addresses) for the following purposes.
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm">
                  <li>Responding to inquiries</li>
                  <li>Analysis to improve the service</li>
                </ul>
                <p>
                  Collected personal information is managed appropriately and protected in
                  accordance with applicable laws.
                </p>
              </>
            ) : (
              <>
                <p>
                  当サイトでは、訪問者から取得した個人情報（名前、メールアドレスなど）を以下の目的で利用します。
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm">
                  <li>お問い合わせへの対応</li>
                  <li>サービス向上のための分析</li>
                </ul>
                <p>
                  取得した個人情報は、適切な方法で管理し、法令に基づいて安全に保護されます。
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              <I18nText locale={resolvedLocale} ja="広告について" en="Advertising" />
            </h2>
            {isEn ? (
              <>
                <p>
                  We use third-party advertising services (Google AdSense, A8.net). Cookies are
                  used to display ads based on user interests. Cookies allow us to recognize your
                  computer, but they do not identify you personally.
                </p>
                <p>
                  For details on disabling cookies and Google AdSense, see{" "}
                  <a
                    href="https://policies.google.com/technologies/ads?gl=jp"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                  >
                    Advertising – Policies and Terms – Google
                  </a>
                  .
                </p>
              </>
            ) : (
              <>
                <p>
                  当サイトでは、第三者配信の広告サービス（Googleアドセンス、A8.net）を利用しており、
                  ユーザーの興味に応じた商品やサービスの広告を表示するため、クッキー（Cookie）を使用しております。
                  クッキーを使用することで当サイトはお客様のコンピュータを識別できるようになりますが、
                  お客様個人を特定できるものではありません。
                </p>
                <p>
                  Cookieを無効にする方法やGoogleアドセンスに関する詳細は「
                  <a
                    href="https://policies.google.com/technologies/ads?gl=jp"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                  >
                    広告 – ポリシーと規約 – Google
                  </a>
                  」をご確認ください。
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              <I18nText locale={resolvedLocale} ja="アクセス解析ツールについて" en="Analytics" />
            </h2>
            {isEn ? (
              <>
                <p>
                  We use Google Analytics. It collects data via cookies. The data is collected
                  anonymously and does not identify individuals. You can disable cookies in your
                  browser settings to opt out of data collection.
                </p>
                <p>
                  See{" "}
                  <a
                    className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                    href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Analytics Terms of Service
                  </a>{" "}
                  and the{" "}
                  <a
                    className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                    href="https://policies.google.com/technologies/ads?hl=ja"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Policies page
                  </a>
                  .
                </p>
              </>
            ) : (
              <>
                <p>
                  当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。
                  このGoogleアナリティクスはデータの収集のためにCookieを使用しています。
                  このデータは匿名で収集されており、個人を特定するものではありません。
                  この機能はCookieを無効にすることで収集を拒否することが出来ますので、
                  お使いのブラウザの設定をご確認ください。
                </p>
                <p>
                  この規約に関しての詳細は
                  <a
                    className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                    href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Googleアナリティクスサービス利用規約
                  </a>
                  のページや
                  <a
                    className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                    href="https://policies.google.com/technologies/ads?hl=ja"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Googleポリシーと規約ページ
                  </a>
                  をご覧ください。
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              <I18nText locale={resolvedLocale} ja="免責事項" en="Disclaimer" />
            </h2>
            {isEn ? (
              <p>
                We strive for accuracy, but we do not guarantee the reliability or safety of the
                information on this site. The site operator is not responsible for any actions
                taken based on the information provided. Use at your own risk.
              </p>
            ) : (
              <p>
                当サイトに掲載する情報は、正確性を期していますが、その内容の信頼性や安全性について保証するものではありません。
                訪問者が当サイトの情報を利用して行う一切の行動について、当サイト運営者は責任を負いかねます。
                自己責任のもとでご利用ください。
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
