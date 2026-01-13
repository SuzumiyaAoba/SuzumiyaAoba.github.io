import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Card } from "@/shared/ui/card";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-12 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="flex flex-col items-center justify-center gap-8 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
            <h2 className="text-2xl font-semibold">ページが見つかりません</h2>
            <p className="text-muted-foreground">
              お探しのページは存在しないか、移動または削除された可能性があります。
            </p>
          </div>
          <Card className="border-transparent bg-card/40 shadow-none">
            <a
              href="/"
              className="flex items-center gap-2 px-6 py-4 text-sm font-medium"
            >
              ← ホームに戻る
            </a>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
