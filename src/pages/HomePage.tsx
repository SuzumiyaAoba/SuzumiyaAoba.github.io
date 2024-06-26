import type { FC } from "hono/jsx";

import { orgPosts } from "@repositories/post/org";
import { css } from "@twind/core";

import { PostListItem } from "@components/post-list-item";

export const HomePage: FC = async () => {
  const posts = (await orgPosts.getPosts()).sort((a, b) =>
    a.id < b.id ? 1 : -1,
  );

  const mainCss = css`
    @apply flex-grow;
    @apply w-full max-w-3xl;
    @apply mx-auto mt-8 mb-12;
  `;

  const titleCss = css`
    @apply font-display;
    @apply text-2xl text-center;
    @apply mb-12;
  `;

  const postsCss = css`
    @apply max-w-3xl;
    @apply grid grid-cols-1 sm:grid-cols-2 gap-8;
  `;

  return (
    <main class={mainCss}>
      <h2 class={titleCss}>Posts</h2>
      <ul class={postsCss}>
        {posts.map((post) => (
          <PostListItem post={post} />
        ))}
      </ul>
    </main>
  );
};
