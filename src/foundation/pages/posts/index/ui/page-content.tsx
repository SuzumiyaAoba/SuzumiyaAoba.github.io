import { SiteLayout } from "@/widgets/site-layout";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

export type PostsIndexPageContentProps = {
  locale: Locale;
  slugs: string[];
};

export function PostsIndexPageContent({ locale, slugs }: PostsIndexPageContentProps) {
  const pagePath = toLocalePath("/posts", locale);

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <main className="site-main">
        <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">Posts</h1>
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
    </SiteLayout>
  );
}
