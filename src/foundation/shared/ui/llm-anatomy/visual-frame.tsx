import type { ReactNode } from "react";

type DemoFrameProps = {
  title: string;
  description: string;
  label?: string;
  children: ReactNode;
};

/** 記事の本文と操作図を区切り、図の対象・簡略化を同じ位置に示す。 */
export function DemoFrame({
  title,
  description,
  label = title,
  children,
}: DemoFrameProps) {
  return (
    <section
      aria-label={label}
      className="llm-demo my-10 min-w-0 space-y-5 border-y border-border py-6 text-sm text-foreground"
    >
      <div className="space-y-2">
        <p className="text-lg font-semibold tracking-tight">{title}</p>
        <p className="leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
