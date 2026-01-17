import type { AnnotationHandler, BlockAnnotation, InlineAnnotation } from "codehike/code";
import { InnerLine } from "codehike/code";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";

export const lineNumbers: AnnotationHandler = {
  name: "line-numbers",
  Line: (props) => {
    const width = props.totalLines.toString().length + 1;
    return (
      <div className="flex items-start">
        <span
          className="mr-4 select-none text-right text-muted-foreground"
          style={{ minWidth: `${width}ch` }}
        >
          {props.lineNumber}
        </span>
        <InnerLine merge={props} />
      </div>
    );
  },
};

export const mark: AnnotationHandler = {
  name: "mark",
  Line: ({ annotation, ...props }) => {
    const color = annotation?.query || "oklch(0.7 0.15 250)";
    return (
      <div
        className="flex w-full"
        style={{
          backgroundColor: annotation && `color-mix(in oklch, ${color} 12%, transparent)`,
          borderWidth: annotation && "0 0 0 2px",
          borderColor: annotation && `color-mix(in oklch, ${color} 60%, transparent)`,
        }}
      >
        <InnerLine merge={props} className="flex-1 px-2" />
      </div>
    );
  },
  Inline: ({ annotation, children }) => {
    const color = annotation?.query || "oklch(0.7 0.15 250)";
    return (
      <span
        className="rounded px-0.5 py-0 -mx-0.5"
        style={{
          outline: `solid 1px color-mix(in oklch, ${color} 55%, transparent)`,
          background: `color-mix(in oklch, ${color} 16%, transparent)`,
        }}
      >
        {children}
      </span>
    );
  },
};

export const diff: AnnotationHandler = {
  name: "diff",
  onlyIfAnnotated: true,
  transform: (annotation: BlockAnnotation) => {
    const color =
      annotation.query === "-" ? "var(--codehike-diff-remove)" : "var(--codehike-diff-add)";
    return [annotation, { ...annotation, name: "mark", query: color }];
  },
  Line: ({ annotation, ...props }) => (
    <>
      <div className="min-w-[1ch] select-none pl-2 opacity-70">{annotation?.query}</div>
      <InnerLine merge={props} />
    </>
  ),
};

export const callout: AnnotationHandler = {
  name: "callout",
  transform: (annotation: InlineAnnotation) => {
    const { name, query, lineNumber, fromColumn, toColumn, data } = annotation;
    return {
      name,
      query,
      fromLineNumber: lineNumber,
      toLineNumber: lineNumber,
      data: { ...data, column: (fromColumn + toColumn) / 2 },
    };
  },
  Block: ({ annotation, children }) => {
    const { column } = annotation.data;
    return (
      <>
        {children}
        <div
          style={{
            minWidth: `${column + 2}ch`,
            left: "3rem",
            backgroundColor: "var(--codehike-callout-bg)",
            borderColor: "var(--codehike-callout-border)",
          }}
          className="relative -ml-[1ch] mt-2 w-fit rounded border px-2 py-1 text-xs text-foreground"
        >
          <div
            style={{
              left: `${column}ch`,
              backgroundColor: "var(--codehike-callout-bg)",
              borderColor: "var(--codehike-callout-border)",
            }}
            className="absolute -top-[1px] h-2 w-2 -translate-y-1/2 rotate-45 border-l border-t"
          />
          {annotation.query}
        </div>
      </>
    );
  },
};

const collapseIcon = (
  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/collapse:-rotate-180" />
);

export const collapse: AnnotationHandler = {
  name: "collapse",
  transform: (annotation: BlockAnnotation) => {
    const { fromLineNumber } = annotation;
    return [
      annotation,
      {
        ...annotation,
        fromLineNumber,
        toLineNumber: fromLineNumber,
        name: "CollapseTrigger",
      },
      {
        ...annotation,
        fromLineNumber: fromLineNumber + 1,
        name: "CollapseContent",
      },
    ];
  },
  Block: ({ annotation, children }) => (
    <Collapsible
      className="group/collapse not-prose"
      defaultOpen={annotation.query !== "collapsed"}
    >
      {children}
    </Collapsible>
  ),
};

export const collapseTrigger: AnnotationHandler = {
  name: "CollapseTrigger",
  onlyIfAnnotated: true,
  AnnotatedLine: ({ ...props }) => (
    <CollapsibleTrigger className="flex w-full cursor-pointer items-start gap-2 bg-transparent p-0 text-left">
      <InnerLine merge={props} data={{ icon: collapseIcon }} />
    </CollapsibleTrigger>
  ),
  Line: (props) => {
    const icon = props.data?.["icon"] as ReactNode;
    return (
      <div className="flex items-start gap-2">
        <span className="pt-0.5">{icon}</span>
        <InnerLine merge={props} />
      </div>
    );
  },
};

export const collapseContent: AnnotationHandler = {
  name: "CollapseContent",
  Block: ({ children }) => <CollapsibleContent className="pl-5">{children}</CollapsibleContent>,
};

export const tooltip: AnnotationHandler = {
  name: "tooltip",
  Inline: ({ children, annotation }) => {
    const { query, data } = annotation;
    return (
      <span className="relative inline-flex group">
        <span className="underline decoration-dotted underline-offset-4">{children}</span>
        <span
          className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-max max-w-[260px] rounded border px-2 py-1 text-xs opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          style={{
            backgroundColor: "var(--codehike-tooltip-bg)",
            borderColor: "var(--codehike-tooltip-border)",
            color: "var(--codehike-tooltip-text)",
          }}
        >
          {data?.children || query}
        </span>
      </span>
    );
  },
};

export const classNameHandler: AnnotationHandler = {
  name: "className",
  Block: ({ annotation, children }) => <div className={annotation.query}>{children}</div>,
  Inline: ({ annotation, children }) => <span className={annotation.query}>{children}</span>,
};

export const footnotes: AnnotationHandler = {
  name: "ref",
  AnnotatedLine: ({ annotation, ...props }) => {
    return (
      <div className="flex items-start gap-2">
        <InnerLine merge={props} />
        <FootnoteNumber n={annotation.data.n} />
      </div>
    );
  },
};

export function FootnoteNumber({ n }: { n: number }) {
  return (
    <span
      data-value={n}
      style={{ borderColor: "var(--codehike-footnote-border)" }}
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-mono leading-none text-muted-foreground"
    />
  );
}
