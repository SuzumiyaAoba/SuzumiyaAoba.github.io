import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy-policy" },
        ])}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Privacy Policy
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">プライバシーポリシー</h1>
        </section>

        <section className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">個人情報の利用目的</h2>
            <p>
              当サイトでは、訪問者から取得した個人情報（名前、メールアドレスなど）を以下の目的で利用します。
            </p>
            <ul className="list-disc space-y-1 pl-6 text-sm">
              <li>お問い合わせへの対応</li>
              <li>サービス向上のための分析</li>
            </ul>
            <p>取得した個人情報は、適切な方法で管理し、法令に基づいて安全に保護されます。</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">広告について</h2>
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
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">アクセス解析ツールについて</h2>
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
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">免責事項</h2>
            <p>
              当サイトに掲載する情報は、正確性を期していますが、その内容の信頼性や安全性について保証するものではありません。
              訪問者が当サイトの情報を利用して行う一切の行動について、当サイト運営者は責任を負いかねます。
              自己責任のもとでご利用ください。
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
