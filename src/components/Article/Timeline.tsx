import { format } from "date-fns";
import Link from "next/link";
import { Tag } from "@/components/Tag";

type TimelineItemProps = {
  slug: string;
  frontmatter: {
    title: string;
    date: Date;
    tags: string[];
  };
  showMonth?: boolean;
};

const TimelineItem = ({
  slug,
  frontmatter,
  showMonth = false,
}: TimelineItemProps) => {
  const date = frontmatter.date;
  const year = format(date, "yyyy");
  const month = format(date, "M"); // 0埋めなしの月
  const day = format(date, "d"); // 0埋めなしの日
  const dayOfWeek = format(date, "EEE"); // 曜日の英語略語表記 (Mon, Tue, Wed, ...)

  return (
    <div className="flex group">
      {/* 左側の日付部分 */}
      <div className="w-24 flex-shrink-0 text-right pr-8 relative">
        <div className="font-bold text-lg">{day}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {dayOfWeek}
        </div>
        {/* 縦線 */}
        <div className="absolute top-0 right-0 h-full w-px bg-gray-400 dark:bg-gray-700">
          <div className="absolute top-2 right-0 w-3 h-3 rounded-full bg-primary transform -translate-x-1/2 transition-all duration-300 group-hover:scale-125"></div>
        </div>
      </div>

      {/* 右側の記事部分 */}
      <div className="pb-8 pt-1 ml-6 w-full">
        {showMonth && (
          <div className="text-sm font-semibold text-primary mb-3 -mt-1 border-b border-primary pb-1 inline-block">
            {`${month}月`}
          </div>
        )}
        <Link
          href={`/blog/post/${slug}/`}
          className="text-lg font-medium block mb-2 transition-colors hover:text-primary"
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
    </div>
  );
};

type TimelineProps = {
  posts: Array<{
    path: string;
    frontmatter: {
      title: string;
      date: Date;
      tags: string[];
    };
  }>;
};

export function Timeline({ posts }: TimelineProps) {
  // 投稿を年ごとにグループ化
  const postsByYear = posts.reduce<Record<string, typeof posts>>(
    (grouped, post) => {
      const year = format(post.frontmatter.date, "yyyy");
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(post);
      return grouped;
    },
    {}
  );

  // 年を降順でソート
  const years = Object.keys(postsByYear).sort(
    (a, b) => parseInt(b) - parseInt(a)
  );

  return (
    <div className="timeline">
      {years.map((year) => {
        // 各年のポストを月ごとに整理
        const postsByMonth: Record<string, typeof posts> = {};

        postsByYear[year].forEach((post) => {
          const month = format(post.frontmatter.date, "M");
          if (!postsByMonth[month]) {
            postsByMonth[month] = [];
          }
          postsByMonth[month].push(post);
        });

        // 月の配列を降順に取得
        const months = Object.keys(postsByMonth).sort(
          (a, b) => parseInt(b) - parseInt(a)
        );

        return (
          <div key={year} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">{year}</h2>
            <div className="ml-2">
              {months.map((month) => {
                const monthPosts = postsByMonth[month];
                return monthPosts.map((post, index) => (
                  <TimelineItem
                    key={post.path}
                    slug={post.path}
                    frontmatter={post.frontmatter}
                    showMonth={index === 0} // 月の最初の記事のみ月表示
                  />
                ));
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
