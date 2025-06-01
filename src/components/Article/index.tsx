import { ReactNode } from "react";
import { format } from "date-fns";
import { cn } from "@/libs/utils";
import markdownStyles from "@/styles/markdown.module.scss";
import { Tag } from "@/components/Tag";
import { HatenaButton } from "@/components/share/HatenaButton";
import { TwitterShareButton } from "@/components/share/TwitterShareButton";
import BuyMeACoffee from "@/components/BuyMeACoffee";
import { Comments } from "@/components/Comments";
import { AuthorInfo } from "@/components/AuthorInfo";
import Script from "next/script";
import config from "@/config";
import { createBlogPostingJsonLd } from "@/libs/jsonld";

export type ArticleProps = {
  title: string;
  date: string | Date;
  tags: string[];
  children: ReactNode;
  className?: string;
  showComments?: boolean;
  showBuyMeACoffee?: boolean;
  showShareButtons?: boolean;
  description?: string;
  author?: string;
  url?: string;
};

export function Article({
  title,
  date,
  tags,
  children,
  className,
  showComments = true,
  showBuyMeACoffee = true,
  showShareButtons = true,
  description,
  author = config.metadata.author,
  url,
}: ArticleProps) {
  const formattedDate =
    typeof date === "string" ? date : format(date, "yyyy/MM/dd");

  // JSON-LDデータの構築
  const jsonLd = createBlogPostingJsonLd({
    title,
    date,
    tags,
    description,
    author,
    url,
  });

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-4 pb-16 relative xl:max-w-7xl">
      <article className={cn(markdownStyles.markdown, className)}>
        {/* JSON-LD 構造化データ */}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* タイトルと記事メタデータ */}
        <div className="mb-8">
          <h1 className="mb-8 text-center">{title}</h1>

          <div className="flex mt-2 mb-2 justify-center items-center">
            <span className="i-ic-outline-sync mr-0.5" />
            {formattedDate}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-2 justify-center text-sm">
              {tags.map((tag) => (
                <Tag
                  key={tag}
                  label={tag}
                  href={`/tags/${encodeURIComponent(tag)}/`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 記事コンテンツと目次 */}
        <section>{children}</section>

        {showShareButtons && (
          <section className="flex gap-x-2 justify-end mt-12 mb-4">
            <HatenaButton />
            <TwitterShareButton title={title} />
          </section>
        )}
      </article>
      {/* 著者情報 */}
      <section className="mt-8 mb-8">
        <AuthorInfo author={author} />
      </section>

      {(showBuyMeACoffee || showComments) && (
        <hr className="mb-8 border-dashed border-neutral-600" />
      )}

      {showBuyMeACoffee && <BuyMeACoffee />}

      {showComments && (
        <section className="mt-8">
          <Comments />
        </section>
      )}
    </div>
  );
}
