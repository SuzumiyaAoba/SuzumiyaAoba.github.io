import { memo, ReactNode } from "react";
import { AdComponent, AdComponentProps } from "../../base/AdComponent";

export interface RakutenProductAdProps
  extends Omit<AdComponentProps, "children"> {
  /** 楽天の広告ID */
  itemCode: string;
  /** 広告表示幅 */
  width?: number | string;
  /** 広告表示高さ */
  height?: number | string;
}

/**
 * 楽天商品広告コンポーネント（ベース）
 */
export const RakutenProductAdComponent = memo(
  ({
    itemCode,
    width = "auto",
    height = "auto",
    className,
    displayOn,
    withContainer = true,
    description = "楽天商品広告",
  }: RakutenProductAdProps) => {
    return (
      <AdComponent
        className={className}
        displayOn={displayOn}
        withContainer={withContainer}
        description={description}
      >
        <div
          className="rakuten-ad"
          data-rakuten-item-id={itemCode}
          style={{ display: "inline-block", width, height }}
        />
      </AdComponent>
    );
  }
);

RakutenProductAdComponent.displayName = "RakutenProductAdComponent";
