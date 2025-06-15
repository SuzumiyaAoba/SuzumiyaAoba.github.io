import { Tag } from "@/components/Tag";
import Link from "next/link";
import { DateDisplay } from "./DateDisplay";
import { type blogFrontmatterSchema } from "@/libs/contents/schema";
import { z } from "zod";

type Post = z.infer<typeof blogFrontmatterSchema>;

export type PostCardProps = {
  post: Post & { _path: string };
  basePath?: string;
};

export const PostCard = ({ post, basePath = "blog" }: PostCardProps) => {
  const { _path, title, date, tags } = post;
  return (
    <div className="card p-4 transition-all duration-300 hover:transform hover:scale-[1.02]">
      <DateDisplay
        date={date}
        className="text-sm"
        style={{ color: "var(--muted)" }}
      />
      <Link
        href={`/${basePath}/${_path}/`}
        className="text-lg block my-2 transition-colors"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </Link>
      <div className="flex flex-wrap mt-2 gap-2 text-xs">
        {tags.map((tag) => (
          <Tag
            key={tag}
            label={tag}
            href={`/tags/${encodeURIComponent(tag)}/`}
          />
        ))}
      </div>
    </div>
  );
};
