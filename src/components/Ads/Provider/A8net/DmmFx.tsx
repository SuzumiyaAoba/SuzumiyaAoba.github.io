import { memo } from "react";
import { A8netAdComponent } from "./A8netAdComponent";

/**
 * DmmFx広告コンポーネント
 * PC用とモバイル用の両方の広告を含む
 */
export const DmmFx = memo(() => {
  return (
    <div>
      {/* デスクトップ用の広告 */}
      <A8netAdComponent
        displayOn="desktop"
        linkUrl="https://px.a8.net/svt/ejp?a8mat=3ZM4V6+6GSIB6+1WP2+63OY9"
        imageUrl="https://www23.a8.net/svt/bgt?aid=241217826391&wid=001&eno=01&mid=s00000008903001025000&mc=1"
        trackerUrl="https://www15.a8.net/0.gif?a8mat=3ZM4V6+6GSIB6+1WP2+63OY9"
        width={468}
        height={60}
        description="DMM FX 広告（デスクトップ向け）"
      />

      {/* モバイル用の広告 */}
      <A8netAdComponent
        displayOn="mobile"
        linkUrl="https://px.a8.net/svt/ejp?a8mat=3ZM4V6+6GSIB6+1WP2+61C2P"
        imageUrl="https://www27.a8.net/svt/bgt?aid=241217826391&wid=001&eno=01&mid=s00000008903001014000&mc=1"
        trackerUrl="https://www10.a8.net/0.gif?a8mat=3ZM4V6+6GSIB6+1WP2+61C2P"
        width={125}
        height={125}
        description="DMM FX 広告（モバイル向け）"
      />
    </div>
  );
});

DmmFx.displayName = "DmmFx";
