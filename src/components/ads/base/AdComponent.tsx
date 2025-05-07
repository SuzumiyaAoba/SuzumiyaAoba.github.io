import { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AdComponentProps {
  /** 広告コンテンツ */
  children: ReactNode;
  /** コンテナのクラス名 */
  className?: string;
  /** 広告を表示するデバイスサイズ */
  displayOn?: "desktop" | "mobile" | "all";
  /** レスポンシブなレイアウト用のコンテナの有無 */
  withContainer?: boolean;
  /** 広告の説明テキスト（アクセシビリティのため） */
  description?: string;
}

/**
 * 広告コンポーネントのベースコンポーネント
 * デバイスサイズに応じた表示制御や共通スタイルを提供
 */
export const AdComponent = memo(
  ({
    children,
    className,
    displayOn = "all",
    withContainer = true,
    description,
  }: AdComponentProps) => {
    const content = (
      <div
        className={cn(
          "ad-content",
          {
            "hidden sm:block": displayOn === "desktop",
            "sm:hidden block": displayOn === "mobile",
            block: displayOn === "all",
          },
          className
        )}
        role="complementary"
        aria-label={description || "広告"}
      >
        {children}
      </div>
    );

    if (withContainer) {
      return <div className="flex justify-center my-4 w-full">{content}</div>;
    }

    return content;
  }
);

AdComponent.displayName = "AdComponent";
