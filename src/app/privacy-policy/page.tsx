export default async function PrivacyPolicy() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">プライバシーポリシー</h1>
      <div>
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
    </main>
  );
}
