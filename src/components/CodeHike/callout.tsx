import { InlineAnnotation, AnnotationHandler } from "codehike/code"

export const callout: AnnotationHandler = {
  name: "callout",
  transform: (annotation: InlineAnnotation) => {
    const { name, query, lineNumber, fromColumn, toColumn, data } = annotation
    return {
      name,
      query,
      fromLineNumber: lineNumber,
      toLineNumber: lineNumber,
      data: { ...data, column: (fromColumn + toColumn) / 2 },
    }
  },
  Block: ({ annotation, children }) => {
    const { column } = annotation.data
    return (
      <>
        {children}
        <div
          style={{
            minWidth: `${column + 2}ch`,
            left: "3rem",
            backgroundColor: "var(--codehike-callout-bg)",
            borderColor: "var(--codehike-callout-border)"
          }}
          className="w-fit border rounded px-2 relative -ml-[1ch] mt-1 whitespace-break-spaces"
        >
          <div
            style={{
              left: `${column}ch`,
              backgroundColor: "var(--codehike-callout-bg)",
              borderColor: "var(--codehike-callout-border)"
            }}
            className="absolute border-l border-t w-2 h-2 rotate-45 -translate-y-1/2 -top-[1px]"
          />
          {annotation.query}
        </div>
      </>
    )
  },
}