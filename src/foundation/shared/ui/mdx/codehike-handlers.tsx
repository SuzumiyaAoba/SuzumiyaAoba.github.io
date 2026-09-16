import { annotationContent, annotationData } from "./annotation-data";
import type {
  AnnotationHandler,
  BlockAnnotation,
  InlineAnnotation,
} from "codehike/code";
import { InnerLine } from "codehike/code";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export const lineNumbers: AnnotationHandler = {
  name: "line-numbers",
  Line: (props) => {
    const width = props.totalLines.toString().length + 1;
    return (
      <div className="flex items-start">
        <span
          className="mr-4 min-w-(--num-w) text-right text-muted-foreground select-none"
          style={{ "--num-w": `${width}ch` }}
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
    const color = annotation?.query || "var(--info)";
    return (
      <div
        className={cn("flex w-full", annotation && "ch-mark-line")}
        style={{ "--mark-color": color }}
      >
        <InnerLine merge={props} className="flex-1 px-2" />
      </div>
    );
  },
  Inline: ({ annotation, children }) => {
    const color = annotation.query || "var(--info)";
    return (
      <span
        className="-mx-0.5 rounded ch-mark-inline px-0.5 py-0"
        style={{ "--mark-color": color }}
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
      annotation.query === "-"
        ? "var(--codehike-diff-remove)"
        : "var(--codehike-diff-add)";
    return [annotation, { ...annotation, name: "mark", query: color }];
  },
  Line: ({ annotation, ...props }) => (
    <>
      <div className="min-w-[1ch] pl-2 opacity-70 select-none">
        {annotation?.query}
      </div>
      <InnerLine merge={props} />
    </>
  ),
};

export const callout: AnnotationHandler = {
  name: "callout",
  transform: (annotation: InlineAnnotation) => {
    const { name, query, lineNumber, fromColumn, toColumn } = annotation;
    return {
      name,
      query,
      fromLineNumber: lineNumber,
      toLineNumber: lineNumber,
      data: {
        ...annotationData(annotation.data),
        column: (fromColumn + toColumn) / 2,
      },
    };
  },
  Block: ({ annotation, children }) => {
    const rawColumn = annotationData(annotation.data)["column"];
    const column = typeof rawColumn === "number" ? rawColumn : 0;
    return (
      <>
        {children}
        <div
          style={{ "--callout-w": `${column + 2}ch` }}
          className="relative left-12 mt-2 -ml-[1ch] w-fit min-w-(--callout-w) rounded border border-(--codehike-callout-border) bg-(--codehike-callout-bg) px-2 py-1 text-xs text-foreground"
        >
          <div
            style={{ "--callout-x": `${column}ch` }}
            className="absolute -top-[1px] left-(--callout-x) h-2 w-2 -translate-y-1/2 rotate-45 border-t border-l border-(--codehike-callout-border) bg-(--codehike-callout-bg)"
          />
          {annotation.query}
        </div>
      </>
    );
  },
};

const collapseIcon = (
  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:-rotate-180" />
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
    <details
      className="group my-0 rounded-none border-0 bg-transparent px-0 py-0"
      open={annotation.query !== "collapsed"}
    >
      {children}
    </details>
  ),
};

export const collapseTrigger: AnnotationHandler = {
  name: "CollapseTrigger",
  onlyIfAnnotated: true,
  AnnotatedLine: ({ lineNumber, totalLines, children }) => {
    const width = totalLines.toString().length + 1;
    return (
      <summary className="flex w-full cursor-pointer list-none items-start font-normal [&::-webkit-details-marker]:hidden">
        <span
          className="mr-4 min-w-(--num-w) text-right text-muted-foreground select-none"
          style={{ "--num-w": `${width}ch` }}
        >
          {lineNumber}
        </span>
        <span className="inline-flex min-w-0 items-start gap-2">
          <span className="pt-0.5">{collapseIcon}</span>
          <span className="min-w-0 flex-1">{children}</span>
        </span>
      </summary>
    );
  },
};

export const collapseContent: AnnotationHandler = {
  name: "CollapseContent",
  Block: ({ children }) => <div>{children}</div>,
};

export const tooltip: AnnotationHandler = {
  name: "tooltip",
  Inline: ({ children, annotation }) => {
    const { query } = annotation;
    const content = annotationContent(
      annotationData(annotation.data)["children"]
    );
    return (
      <span className="group relative inline-flex">
        <span className="underline decoration-dotted underline-offset-4">
          {children}
        </span>
        <span className="pointer-events-none absolute top-full left-0 z-10 mt-2 w-max max-w-[260px] rounded border border-(--codehike-tooltip-border) bg-(--codehike-tooltip-bg) px-2 py-1 text-xs text-(--codehike-tooltip-text) opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          {content ?? query}
        </span>
      </span>
    );
  },
};

export const classNameHandler: AnnotationHandler = {
  name: "className",
  Block: ({ annotation, children }) => (
    <div className={annotation.query}>{children}</div>
  ),
  Inline: ({ annotation, children }) => (
    <span className={annotation.query}>{children}</span>
  ),
};

export const footnotes: AnnotationHandler = {
  name: "ref",
  AnnotatedLine: ({ annotation, ...props }) => (
    <div className="flex items-start gap-2">
      <InnerLine merge={props} />
      <FootnoteNumber n={Number(annotationData(annotation.data)["n"] ?? 0)} />
    </div>
  ),
};

export function FootnoteNumber({ n }: { n: number }) {
  return (
    <span
      data-value={n}
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-(--codehike-footnote-border) font-mono text-[10px] leading-none text-muted-foreground"
    />
  );
}
