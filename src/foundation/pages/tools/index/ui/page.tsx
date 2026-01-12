import Link from "next/link";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }])} />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            TOOLS
          </h1>
        </section>

        <section className="mt-8">
          <ul className="list-disc space-y-3 pl-6 text-sm text-muted-foreground">
            <li>
              <Link
                href="/tools/ascii-standard-code/"
                className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
              >
                ASCII Standard Code
              </Link>
            </li>
            <li>
              <Link
                href="/tools/asset-formation-simulator/"
                className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
              >
                資産形成シミュレーション
              </Link>
            </li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
