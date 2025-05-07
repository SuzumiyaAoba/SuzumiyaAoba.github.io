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

// スタイルを定数として抽出
const styles = {
  table: {
    border: "1px solid #ccc",
    width: "300px",
  },
  tableRow: {
    borderStyle: "none",
  },
  imageCell: {
    verticalAlign: "top" as const,
    borderStyle: "none",
    padding: "10px",
    width: "44px",
  },
  image: {
    border: "0",
  },
  infoCell: {
    fontSize: "12px",
    verticalAlign: "middle" as const,
    borderStyle: "none",
    padding: "10px",
  },
  titleContainer: {
    padding: "0",
    margin: "0",
  },
  priceContainer: {
    color: "#666",
    marginTop: "5px",
    lineHeight: "1.5",
  },
  priceValue: {
    fontSize: "14px",
    color: "#C00",
    fontWeight: "bold",
  },
  dateTime: {
    fontSize: "10px",
    fontWeight: "normal",
  },
  reviewCount: {
    fontWeight: "bold",
  },
  trackerImage: {
    border: "0",
  },
};

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
    // 価格表示テキストの生成
    interface FormatPriceProps {
      price: string | number;
    }

    const formatPrice = ({ price }: FormatPriceProps): string => {
      return typeof price === "number" ? `${price}円` : price;
    };

    // 商品画像コンポーネント
    interface ProductImageProps {
      productUrl: string;
      imageUrl: string;
    }

    const ProductImage = ({ productUrl, imageUrl }: ProductImageProps) => (
      <a href={productUrl} rel="nofollow" target="_blank">
        <Image
          style={styles.image}
          alt=""
          src={imageUrl}
          width={64}
          height={64}
          unoptimized={imageUrl.startsWith("http")} // 外部URLの場合は最適化しない
        />
      </a>
    );

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
            style={{ ...styles.table, ...containerStyle }}
          >
            <tbody>
              <tr style={styles.tableRow}>
                <td style={styles.imageCell}>
                  <ProductImage productUrl={productUrl} imageUrl={imageUrl} />
                </td>
                <td style={styles.infoCell}>
                  <p style={styles.titleContainer}>
                    <a href={productUrl} rel="nofollow" target="_blank">
                      {productName}
                    </a>
                  </p>
                  <p style={styles.priceContainer}>
                    価格:
                    <span style={styles.priceValue}>
                      {formatPrice({ price })}
                    </span>
                    <br />
                    {priceDateTime && (
                      <span style={styles.dateTime}>({priceDateTime})</span>
                    )}
                    <br />
                    <span style={styles.reviewCount}>
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
            style={styles.trackerImage}
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
