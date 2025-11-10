import { AnnotationHandler } from "codehike/code";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export const tooltip: AnnotationHandler = {
  name: "tooltip",
  Inline: ({ children, annotation }) => {
    const { query, data } = annotation;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="underline decoration-dashed">
            {children}
          </TooltipTrigger>
          <TooltipContent
            align="start"
            style={{
              backgroundColor: "var(--codehike-tooltip-bg)",
              borderColor: "var(--codehike-tooltip-border)",
              color: "var(--codehike-tooltip-text)",
            }}
          >
            {data?.children || query}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
};
