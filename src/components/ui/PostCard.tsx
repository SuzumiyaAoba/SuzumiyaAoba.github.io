import { Tag } from "@/components/Tag";
import Link from "next/link";
import { DateDisplay } from "./DateDisplay";

export type PostCardProps = {
  slug: string;
  frontmatter: {
    title: string;
    date: Date;
    tags: string[];
  };
  basePath?: string;
};

export const PostCard = ({
  slug,
  frontmatter,
  basePath = "blog",
}: PostCardProps) => {
  return (
    <div className="card p-4 transition-all duration-300 hover:transform hover:scale-[1.02]">
      <DateDisplay
        date={frontmatter.date}
        className="text-sm"
        style={{ color: "var(--muted)" }}
      />
      <Link
        href={`/${basePath}/${slug}/`}
        className="text-lg block my-2 transition-colors"
        style={{ color: "var(--foreground)" }}
      >
        {frontmatter.title}
      </Link>
      <div className="flex flex-wrap mt-2 gap-2 text-xs">
        {frontmatter.tags.map((tag) => (
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
