import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

export type PostsIndexPageContentProps = {
  locale: Locale;
  slugs: string[];
};

export function PostsIndexPageContent({ locale, slugs }: PostsIndexPageContentProps) {
  const pagePath = toLocalePath("/posts", locale);

  return (
    <div className="site-page">
      <Header locale={locale} path={pagePath} />
      <main className="site-main">
        <h1 className="text-3xl font-semibold">Posts</h1>
        <ul className="mt-6 space-y-2">
          {slugs.map((slug) => (
            <li key={slug}>
              <a
                className="underline underline-offset-4"
                href={toLocalePath(`/posts/${slug}`, locale)}
              >
                {slug}
              </a>
            </li>
          ))}
        </ul>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
