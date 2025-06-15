import { Tag } from "@/components/Tag";
import { FC } from "react";
import { cn } from "@/libs/utils";
import { DateDisplay } from "./DateDisplay";
import { z } from "zod";
import {
  noteFrontmatterSchema,
  bookFrontmatterSchema,
  blogFrontmatterSchema,
} from "@/libs/contents/schema";

// A general post type that can be any of the frontmatter schemas
type PostItem = (
  | z.infer<typeof noteFrontmatterSchema>
  | z.infer<typeof bookFrontmatterSchema>
  | z.infer<typeof blogFrontmatterSchema>
) & { _path: string };

export type PostListProps = {
  posts: PostItem[];
  basePath: string;
  title?: string;
  variant?: "card" | "list" | "simple";
  className?: string;
  showTags?: boolean;
  showDate?: boolean;
};

export const PostList: FC<PostListProps> = ({
  posts,
  basePath,
  title,
  variant = "list",
  className,
  showTags = true,
  showDate = true,
}) => {
  const filteredPosts = posts.filter((post) => "parent" in post && post.parent);

  if (filteredPosts.length === 0) return null;

  const renderPost = (post: PostItem) => {
    const { _path, title, date, tags } = post;

    if (variant === "simple") {
      return (
        <li key={_path}>
          <a href={`/${basePath}/${_path}/`} className="hover:underline">
            {title}
          </a>
        </li>
      );
    }

    return (
      <div
        key={_path}
        className={cn(
          variant === "card"
            ? "card p-4 transition-all duration-300 hover:transform hover:scale-[1.02]"
            : ""
        )}
      >
        {showDate && <DateDisplay date={date} className="text-sm mb-2" />}
        <a
          href={`/${basePath}/${_path}/`}
          className={cn(
            "hover:underline",
            variant === "card"
              ? "text-lg block my-2 transition-colors"
              : "block"
          )}
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </a>
        {showTags && tags && tags.length > 0 && (
          <div className="flex flex-wrap mt-2 gap-2 text-xs">
            {tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={cn("mb-8", className)}>
      {title && (
        <h3 className="mb-4 text-xl font-bold border-l-4 pl-2 border-neutral-600">
          {title}
        </h3>
      )}

      {variant === "simple" ? (
        <ul className="mb-8 pl-8 list-disc">{filteredPosts.map(renderPost)}</ul>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-6",
            variant === "card" ? "gap-4" : "gap-6"
          )}
        >
          {filteredPosts.map(renderPost)}
        </div>
      )}
    </section>
  );
};
