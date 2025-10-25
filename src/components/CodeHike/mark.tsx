import { AnnotationHandler, InnerLine } from "codehike/code";

export const mark: AnnotationHandler = {
  name: "mark",
  Line: ({ annotation, ...props }) => {
    const color = annotation?.query || "rgb(14 165 233)";
    return (
      <div
        className="flex w-full"
        style={{
          backgroundColor: annotation && `rgb(from ${color} r g b / 0.1)`,
          borderWidth: annotation && "0 0 0 2px",
          borderColor: annotation && `rgb(from ${color} r g b / 0.6)`,
        }}
      >
        <InnerLine merge={props} className="px-2 flex-1" />
      </div>
    );
  },
  Inline: ({ annotation, children }) => {
    const color = annotation?.query || "rgb(14 165 233)";
    return (
      <span
        className="rounded px-0.5 py-0 -mx-0.5"
        style={{
          outline: `solid 1px rgb(from ${color} r g b / 0.5)`,
          background: `rgb(from ${color} r g b / 0.13)`,
        }}
      >
        {children}
      </span>
    );
  },
};
