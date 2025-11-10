import {
  RawCode,
  Pre,
  highlight,
  AnnotationHandler,
  InnerLine,
} from "codehike/code";

export const footnotes: AnnotationHandler = {
  name: "ref",
  AnnotatedLine: ({ annotation, ...props }) => {
    return (
      <div className="flex gap-2">
        <InnerLine merge={props} />
        <Number n={annotation.data.n} />
      </div>
    );
  },
};

export function Number({ n }: { n: number }) {
  return (
    <span
      data-value={n}
      style={{ borderColor: "var(--codehike-footnote-border)" }}
      className="after:content-[attr(data-value)] border rounded-full inline-block h-4 w-4 text-center leading-4 text-sm font-mono self-center"
    />
  );
}
