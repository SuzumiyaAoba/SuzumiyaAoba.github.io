import { AnnotationHandler, InnerLine } from "codehike/code";

export const lineNumbers: AnnotationHandler = {
  name: "line-numbers",
  Line: (props) => {
    const width = props.totalLines.toString().length + 1;
    return (
      <div className="flex">
        <span
          className="mr-2"
          style={{ minWidth: `${width}ch`, color: "gray" }}
        >
          {props.lineNumber}
        </span>
        <InnerLine merge={props} />
      </div>
    );
  },
};
