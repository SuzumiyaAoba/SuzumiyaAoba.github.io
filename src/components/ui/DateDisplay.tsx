import { format } from "date-fns";
import { cn } from "@/libs/utils";
import { CSSProperties } from "react";

export type DateDisplayProps = {
  date: Date | string;
  formatString?: string;
  showIcon?: boolean;
  className?: string;
  iconClassName?: string;
  style?: CSSProperties;
};

export const DateDisplay = ({
  date,
  formatString = "yyyy/MM/dd",
  showIcon = true,
  className,
  iconClassName,
  style,
}: DateDisplayProps) => {
  const formattedDate =
    typeof date === "string" ? date : format(date, formatString);

  return (
    <div
      className={cn("flex gap-x-1 items-center font-thin", className)}
      style={style}
    >
      {showIcon && <div className={cn("i-mdi-calendar", iconClassName)} />}
      <div>{formattedDate}</div>
    </div>
  );
};
