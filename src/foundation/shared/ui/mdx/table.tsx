import type { TableHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

type MdxTableProps = TableHTMLAttributes<HTMLTableElement>;

export function MdxTable({ className, ...props }: MdxTableProps) {
  return (
    <div className="mdx-table">
      <table className={cn(className)} {...props} />
    </div>
  );
}
