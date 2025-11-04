import { AnnotationHandler, BlockAnnotation, InnerLine } from "codehike/code";

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
      <div className="min-w-[1ch] box-content opacity-70 pl-2 select-none">
        {annotation?.query}
      </div>
      <InnerLine merge={props} />
    </>
  ),
};
