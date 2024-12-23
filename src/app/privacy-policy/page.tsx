export default async function PrivacyPolicy() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">プライバシーポリシー</h1>
      <h2 className="mb-4 text-xl font-bold">個人情報の利用目的</h2>
      <div className="mb-8">
        当サイトでは、訪問者から取得した個人情報（名前、メールアドレスなど）を以下の目的で利用します。
        <ul className="list-disc pl-8 my-4">
          <li>お問い合わせへの対応</li>
          <li>サービス向上のための分析</li>
        </ul>
        取得した個人情報は、適切な方法で管理し、法令に基づいて安全に保護されます。
      </div>
      <h2>広告について</h2>
      <div>
        当サイトでは、第三者配信の広告サービス（Googleアドセンス、A8.net）を利用しており、ユーザーの興味に応じた商品やサービスの広告を表示するため、クッキー（Cookie）を使用しております。
        クッキーを使用することで当サイトはお客様のコンピュータを識別できるようになりますが、お客様個人を特定できるものではありません。
        Cookieを無効にする方法やGoogleアドセンスに関する詳細は「
        <a href="https://policies.google.com/technologies/ads?gl=jp">
          広告 – ポリシーと規約 – Google
        </a>
        」をご確認ください。
      </div>
      <h2 className="mb-4 text-xl font-bold">アクセス解析ツールについて</h2>
      <div className="mb-8">
        当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。このGoogleアナリティクスはデータの収集のためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
        この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関しての詳細は
        <a
          className="text-blue-500 hover:underline"
          href="https://marketingplatform.google.com/about/analytics/terms/jp/"
          target="_blank"
        >
          Googleアナリティクスサービス利用規約
        </a>
        のページや
        <a
          className="text-blue-500 hover:underline"
          href="https://policies.google.com/technologies/ads?hl=ja"
          target="_blank"
        >
          Googleポリシーと規約ページ
        </a>
        をご覧ください。
      </div>
      <h2 className="mb-4 text-xl font-bold">免責事項</h2>
      <div className="mb-8">
        当サイトに掲載する情報は、正確性を期していますが、その内容の信頼性や安全性について保証するものではありません。訪問者が当サイトの情報を利用して行う一切の行動について、当サイト運営者は責任を負いかねます。自己責任のもとでご利用ください。
      </div>
    </main>
  );
}
