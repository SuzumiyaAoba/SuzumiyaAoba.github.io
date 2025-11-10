import { format } from "date-fns";
import Link from "next/link";
import { Tag } from "@/components/Tag";
import { type blogFrontmatterSchema } from "@/libs/contents/schema";
import { z } from "zod";

type Post = z.infer<typeof blogFrontmatterSchema> & { _path: string };

type TimelineItemProps = {
  post: Post;
  showMonth?: boolean;
  isLastInMonth?: boolean; // 月の最後の記事かどうか
};

const TimelineItem = ({
  post,
  showMonth = false,
  isLastInMonth = false, // デフォルトはfalse
}: TimelineItemProps) => {
  const { _path, title, subtitle, date, tags } = post;
  const year = format(date, "yyyy");
  const month = format(date, "M"); // 0埋めなしの月
  const day = format(date, "d"); // 0埋めなしの日
  const dayOfWeek = format(date, "EEE"); // 曜日の英語略語表記 (Mon, Tue, Wed, ...)

  // 円と線の位置を正確に定義
  const CIRCLE_SIZE = 16; // 16px = 4 * 4 (w-4 h-4)
  const CIRCLE_CENTER_Y = 16; // 円の中心のY座標

  return (
    <div className={`flex group relative ${isLastInMonth ? "mb-16" : "mb-2"}`}>
      {/* 左側の日付部分 */}
      <div className="w-12 flex-shrink-0 text-right pr-8 relative">
        <div className="font-bold text-lg">{day}</div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {dayOfWeek}
        </div>

        {/* タイムラインのコネクタコンテナ */}
        <div className="absolute top-0 right-0 h-full flex items-center flex-col">
          {/* 円のマーカー */}
          <div
            className="absolute right-0 w-4 h-4 rounded-full transform -translate-x-1/2 transition-all duration-300 group-hover:scale-125 z-10"
            style={{
              top: `${CIRCLE_CENTER_Y - CIRCLE_SIZE / 2}px`,
              backgroundColor: "var(--accent-primary)",
              boxShadow: `0 0 0 2px var(--background), 0 0 0 4px rgba(var(--primary-rgb), 0.3)`,
            }}
          ></div>

          {/* 円の中心から下に伸びる縦線 - 最後のアイテムでない場合のみ表示 */}
          {!isLastInMonth && (
            <div
              className="absolute right-3.5 w-[2px] -translate-x-1/2"
              style={{
                top: `${CIRCLE_CENTER_Y}px`,
                height: `calc(100% - ${CIRCLE_CENTER_Y}px + 1.5rem)`,
                backgroundColor: "var(--accent-primary)",
                opacity: 0.4,
              }}
            ></div>
          )}
        </div>
      </div>

      {/* 右側の記事部分 */}
      <div className="pt-1 ml-6 w-full pb-5">
        {showMonth && (
          <div
            className="text-sm font-semibold mb-3 -mt-1 border-b pb-1 inline-block"
            style={{
              color: "var(--accent-primary)",
              borderColor: "var(--accent-primary)",
              opacity: 0.9,
            }}
          >
            {`${month}月`}
          </div>
        )}
        <Link
          href={`/blog/post/${_path}/`}
          className="text-lg font-medium block mb-2 transition-colors hover:text-primary"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </Link>
        {subtitle && (
          <div className="text-sm mb-2" style={{ color: "var(--muted)" }}>
            {subtitle}
          </div>
        )}
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
    </div>
  );
};

type TimelineProps = {
  posts: Post[];
};

export function Timeline({ posts }: TimelineProps) {
  // 投稿を年ごとにグループ化
  const postsByYear = posts.reduce<Record<string, typeof posts>>(
    (grouped, post) => {
      const year = format(post.date, "yyyy");
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(post);
      return grouped;
    },
    {},
  );

  // 年を降順でソート
  const years = Object.keys(postsByYear).sort(
    (a, b) => parseInt(b) - parseInt(a),
  );

  return (
    <div className="timeline">
      {years.map((year) => {
        // 各年のポストを月ごとに整理
        const postsByMonth: Record<string, typeof posts> = {};

        postsByYear[year].forEach((post) => {
          const month = format(post.date, "M");
          if (!postsByMonth[month]) {
            postsByMonth[month] = [];
          }
          postsByMonth[month].push(post);
        });

        // 月の配列を降順に取得
        const months = Object.keys(postsByMonth).sort(
          (a, b) => parseInt(b) - parseInt(a),
        );

        return (
          <div key={year} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">{year}</h2>
            <div className="ml-2">
              {months.map((month) => {
                const monthPosts = postsByMonth[month];
                return monthPosts.map((post, index) => (
                  <TimelineItem
                    key={post._path}
                    post={post}
                    showMonth={index === 0} // 月の最初の記事のみ月表示
                    isLastInMonth={index === monthPosts.length - 1} // 月の最後の記事かどうか
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
