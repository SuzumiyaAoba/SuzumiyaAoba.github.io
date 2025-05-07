import { memo } from "react";

/**
 * フッター広告を表示するコンポーネント
 * 異なるプロバイダーの広告を管理・表示する
 */
export const FooterAds = memo(() => {
  return (
    <div className="flex flex-col items-center gap-8 mx-auto mb-12">
      {/* 将来的な広告実装のためのプレースホルダー */}
    </div>
  );
});

FooterAds.displayName = "FooterAds";
