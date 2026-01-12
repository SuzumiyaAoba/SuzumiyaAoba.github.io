import { EmptyPage } from "@/shared/ui/empty-page";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

export async function generateStaticParams(): Promise<Array<{ slug: string[] }>> {
  return [];
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <EmptyPage />
      <Footer />
    </div>
  );
}
