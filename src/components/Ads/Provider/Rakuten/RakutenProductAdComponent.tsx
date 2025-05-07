import { memo } from "react";
import Image from "next/image";
import { AdComponent, AdComponentProps } from "../../AdComponent";

export interface RakutenProductAdProps
  extends Omit<AdComponentProps, "children"> {
  /** 商品のリンクURL */
  productUrl: string;
  /** 商品の画像URL */
  imageUrl: string;
  /** 商品名 */
  productName: string;
  /** 商品価格 */
  price: string | number;
  /** 価格取得時刻 */
  priceDateTime?: string;
  /** 商品の評価数 */
  reviewCount?: number;
  /** 追跡用の画像URL */
  trackerUrl: string;
  /** 追加のスタイル */
  containerStyle?: React.CSSProperties;
}

/**
 * 楽天商品広告コンポーネント
 */
export const RakutenProductAdComponent = memo(
  ({
    productUrl,
    imageUrl,
    productName,
    price,
    priceDateTime,
    reviewCount = 0,
    trackerUrl,
    containerStyle = {},
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
        <>
          <table
            cellPadding="0"
            cellSpacing="0"
            style={{
              border: "1px solid #ccc",
              width: "300px",
              ...containerStyle,
            }}
          >
            <tbody>
              <tr style={{ borderStyle: "none" }}>
                <td
                  style={{
                    verticalAlign: "top",
                    borderStyle: "none",
                    padding: "10px",
                    width: "44px",
                  }}
                >
                  <a href={productUrl} rel="nofollow" target="_blank">
                    <Image
                      style={{ border: "0" }}
                      alt=""
                      src={imageUrl}
                      width={64}
                      height={64}
                      unoptimized={imageUrl.startsWith("http")} // 外部URLの場合は最適化しない
                    />
                  </a>
                </td>
                <td
                  style={{
                    fontSize: "12px",
                    verticalAlign: "middle",
                    borderStyle: "none",
                    padding: "10px",
                  }}
                >
                  <p style={{ padding: "0", margin: "0" }}>
                    <a href={productUrl} rel="nofollow" target="_blank">
                      {productName}
                    </a>
                  </p>
                  <p
                    style={{
                      color: "#666",
                      marginTop: "5px",
                      lineHeight: "1.5",
                    }}
                  >
                    価格:
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#C00",
                        fontWeight: "bold",
                      }}
                    >
                      {typeof price === "number" ? `${price}円` : price}
                    </span>
                    <br />
                    {priceDateTime && (
                      <span style={{ fontSize: "10px", fontWeight: "normal" }}>
                        ({priceDateTime})
                      </span>
                    )}
                    <br />
                    <span style={{ fontWeight: "bold" }}>
                      感想({reviewCount}件)
                    </span>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
          {/* トラッカー画像はimgのままでも警告は無視できる */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            style={{ border: "0" }}
            width="1"
            height="1"
            src={trackerUrl}
            alt=""
            loading="lazy"
          />
        </>
      </AdComponent>
    );
  }
);

RakutenProductAdComponent.displayName = "RakutenProductAdComponent";
