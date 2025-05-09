import { AnnotationHandler, InnerLine } from "codehike/code";

export const lineNumbers: AnnotationHandler = {
  name: "line-numbers",
  Line: (props) => {
    const width = props.totalLines.toString().length + 1;
    return (
      <div className="flex items-start">
        <span
          className="mr-4 select-none text-right"
          style={{ minWidth: `${width}ch`, color: "var(--muted)" }}
        >
          {props.lineNumber}
        </span>
        <InnerLine merge={props} />
      </div>
    );
  },
};
