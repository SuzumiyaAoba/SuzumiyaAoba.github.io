import { memo } from "react";
import { RakutenProductAdComponent } from "../RakutenProductAdComponent";

/**
 * TidyFirst? の楽天アフィリエイト広告
 */
export const KiddyFirst = memo(() => {
  return (
    <RakutenProductAdComponent
      productUrl="https://rpx.a8.net/svt/ejp?a8mat=3ZM4V6+6HDXWY+2HOM+BWGDT&rakuten=y&a8ejpredirect=https%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2Fg00q0724.2bo11c45.g00q0724.2bo12179%2Fa24121734968_3ZM4V6_6HDXWY_2HOM_BWGDT%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fbook%252F18062093%252F%26amp%3Bm%3Dhttp%253A%252F%252Fm.rakuten.co.jp%252Fbook%252Fi%252F21450369%252F%26amp%3Brafcid%3Dwsc_i_is_33f72da33714639c415e592c9633ecd7"
      imageUrl="https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0911/9784814400911_1_2.jpg?_ex=64x64"
      productName="Tidy First? 個人で実践する経験主義的ソフトウェア設計 [ Kent Beck ]"
      price={2640}
      priceDateTime="2024/12/21 17:43時点"
      reviewCount={0}
      trackerUrl="https://www14.a8.net/0.gif?a8mat=3ZM4V6+6HDXWY+2HOM+BWGDT"
      description="「Tidy First?」書籍広告"
    />
  );
});

KiddyFirst.displayName = "KiddyFirst";
