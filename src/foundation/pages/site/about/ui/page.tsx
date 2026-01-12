import Link from "next/link";
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
          { name: "About", path: "/about" },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-10 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              About
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">SuzumiyaAoba</h1>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            開発・読書・ツールづくりの記録をまとめる場所です。記事の整理と公開を続けながら、
            学習の過程や試行錯誤をログとして残しています。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Writing",
              body: "ブログと連載記事の更新。技術メモや検証結果を中心に掲載。",
            },
            {
              title: "Building",
              body: "小さなツールや実験的なプロトタイプの開発ログ。",
            },
            {
              title: "Learning",
              body: "書籍や資料からの学びを整理し、後で参照できる形で保存。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-card/40 px-5 py-6 text-sm text-muted-foreground shadow-none"
            >
              <div className="text-base font-semibold text-foreground">{item.title}</div>
              <p className="mt-2 leading-6">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-card/40 px-5 py-6 shadow-none">
            <h2 className="text-lg font-semibold">Contents</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/blog" className="font-medium text-foreground">
                  ブログ
                </Link>
                <span>：技術メモと更新履歴</span>
              </li>
              <li>
                <Link href="/series" className="font-medium text-foreground">
                  シリーズ
                </Link>
                <span>：テーマ別の連載まとめ</span>
              </li>
              <li>
                <Link href="/tools" className="font-medium text-foreground">
                  ツール
                </Link>
                <span>：小さなプロダクトの公開</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-card/40 px-5 py-6 shadow-none">
            <h2 className="text-lg font-semibold">Contact</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              お問い合わせは
              <Link href="/contact" className="font-medium text-foreground">
                Contact
              </Link>
              ページからお願いします。
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
