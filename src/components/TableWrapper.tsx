import { FC, PropsWithChildren, memo } from "react";
import { cn } from "@/lib/utils";

export interface TableWrapperProps extends PropsWithChildren {
  /** 追加のクラス名 */
  className?: string;
  /** テーブルに適用するクラス名 */
  tableClassName?: string;
  /** テーブルキャプション */
  caption?: string;
  /** テーブルの概要（スクリーンリーダー用） */
  summary?: string;
}

export const TableWrapper: FC<TableWrapperProps> = memo(
  ({ children, className, tableClassName, caption, summary }) => {
    return (
      <div className={cn("overflow-x-auto my-4 border rounded", className)}>
        <table className={cn("w-full", tableClassName)} summary={summary}>
          {caption && (
            <caption className="p-2 text-sm text-center">{caption}</caption>
          )}
          {children}
        </table>
      </div>
    );
  }
);

TableWrapper.displayName = "TableWrapper";
