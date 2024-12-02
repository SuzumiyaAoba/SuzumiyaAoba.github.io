import { AnnotationHandler, InnerLine } from "codehike/code";

export function HoverContainer(props: { children: React.ReactNode }) {
  return <div className="hover-container">{props.children}</div>;
}

export const hover: AnnotationHandler = {
  name: "hover",
  onlyIfAnnotated: true,
  Line: ({ annotation, ...props }) => (
    <InnerLine
      merge={props}
      className="transition-opacity"
      data-line={annotation?.query || ""}
    />
  ),
};

export function Link(props: { href?: string; children?: React.ReactNode }) {
  if (props.href?.startsWith("hover:")) {
    const hover = props.href.slice("hover:".length);
    return (
      <span
        className="underline decoration-dotted underline-offset-4"
        data-hover={hover}
      >
        {props.children}
      </span>
    );
  } else {
    return <a {...props} />;
  }
}
