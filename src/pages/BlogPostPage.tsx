import { raw } from "hono/html";
import type { FC } from "hono/jsx";

import { format } from "date-fns";

import Giscus from "@libs/components/giscus";

import { CalendarDate } from "@components/calendar-date";
import { Tag } from "@components/tag";
import { metadata } from "@metadata";
import { orgPosts } from "@repositories/post/org";
import postMarkdownStyle from "@styles/markdown";

export const BlogPostPage: FC<{ dir: string }> = async ({ dir }) => {
  const post = await orgPosts.getPost(dir);
  if (!post) {
    return <div>404 Not Found</div>;
  }
  const { year, month, date } = post.createdAt;
  const { slug } = post;

  return (
    <main className="max-w-3xl w-full mx-auto mb-12">
      <article class="mb-16">
        <h1 class="flex my-1 justify-center font-black text-2xl">
          <a
            class="no-underline"
            href={`/blog/${format(
              new Date(year, month - 1, date),
              "yyyy/MM/dd",
            )}/${slug}/`}
          >
            {post.title}
          </a>
        </h1>
        <div className="flex justify-center my-2">
          <CalendarDate date={new Date(year, month - 1, date)} />
        </div>
        <ul class="flex flex-wrap list-none justify-center">
          {post.tags.map((tag) => (
            <li>
              <Tag name={tag} />
            </li>
          ))}
        </ul>
        <div class={postMarkdownStyle}>{raw(post.html)}</div>
      </article>
      <hr />
      <section class="mt-16">
        <Giscus {...metadata.giscus} />
      </section>
    </main>
  );
};
