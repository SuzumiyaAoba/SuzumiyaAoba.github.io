import { ReactNode } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import markdownStyles from "@/styles/markdown.module.scss";
import { Tag } from "@/components/Tag";
import { HatenaButton } from "@/components/share/HatenaButton";
import { TwitterShareButton } from "@/components/share/TwitterShareButton";
import BuyMeACoffee from "@/components/BuyMeACoffee";
import { Comments } from "@/components/Comments";

export type ArticleProps = {
  title: string;
  date: string | Date;
  tags: string[];
  children: ReactNode;
};

export function Article({ title, date, tags, children }: ArticleProps) {
  return (
    <article
      className={cn(
        markdownStyles.markdown,
        "max-w-4xl w-full mx-auto px-4 pb-16"
      )}
    >
      <h1 className="mt-8 mb-4 text-center">{title}</h1>

      <div className="flex mt-2 mb-2 justify-center items-center">
        <span className="i-ic-outline-sync mr-0.5" />
        {typeof date === "string" ? date : format(date, "yyyy/MM/dd")}
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-2 justify-center text-sm">
        {tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>

      <section>{children}</section>

      <section className="flex gap-x-2 justify-end mt-12 mb-4">
        <HatenaButton />
        <TwitterShareButton title={title} />
      </section>

      <hr className="mb-8 border-dashed border-neutral-600" />
      <BuyMeACoffee />

      <section className="mt-8">
        <Comments />
      </section>
    </article>
  );
}
