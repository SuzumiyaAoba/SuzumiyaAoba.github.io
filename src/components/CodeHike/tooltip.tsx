import { AnnotationHandler } from "codehike/code"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";

export const tooltip: AnnotationHandler = {
  name: "tooltip",
  Inline: ({ children, annotation }) => {
    const { query, data } = annotation;
    const { resolvedTheme } = useTheme();
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="underline decoration-dashed">
            {children}
          </TooltipTrigger>
          <TooltipContent 
            align="start"
            className={`${resolvedTheme === "dark" ? "border-gray-700 bg-gray-800 text-gray-200" : ""}`}
          >
            {data?.children || query}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  },
}