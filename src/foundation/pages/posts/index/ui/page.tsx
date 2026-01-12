
import { getPostSlugs } from "../lib";

export default async function Page() {
  const slugs = await getPostSlugs();

  return (
    <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
      <h1 className="text-3xl font-semibold">Posts</h1>
      <ul className="mt-6 space-y-2">
        {slugs.map((slug) => (
          <li key={slug}>
            <a className="underline underline-offset-4" href={`/posts/${slug}`}>
              {slug}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
