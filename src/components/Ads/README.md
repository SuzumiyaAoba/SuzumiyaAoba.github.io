# 広告コンポーネントアーキテクチャ

このディレクトリには、サイト内で使用する広告関連のコンポーネントが含まれています。

## ディレクトリ構造

```
ads/
├── base/            # 基本コンポーネント
│   └── AdComponent.tsx  # 共通の広告表示コンポーネント
├── containers/      # コンテナコンポーネント
│   └── FooterAds.tsx    # フッターに表示する広告コンテナ
└── providers/       # 広告プロバイダー別のコンポーネント
    ├── a8net/       # A8.net広告
    ├── google/      # Google AdSense広告
    ├── ninja/       # 忍者広告
    └── rakuten/     # 楽天広告
        └── products/  # 楽天の商品広告
```

## 使用方法

### 基本コンポーネント

`AdComponent`は全ての広告表示の基本となるコンポーネントです。レスポンシブ対応やアクセシビリティを考慮しています。

```tsx
import { AdComponent } from "@/components/ads/base/AdComponent";

<AdComponent
  displayOn="all" // "desktop" | "mobile" | "all"
  withContainer={true}
  description="広告の説明"
>
  {/* 広告コンテンツ */}
</AdComponent>;
```

### プロバイダー別コンポーネント

各広告プロバイダー用の特化したコンポーネントを使用できます：

```tsx
import { NinjaAdComponent } from "@/components/ads/providers/ninja/NinjaAdComponent";

<NinjaAdComponent
  adId="広告ID"
  width="728px"
  height="90px"
  displayOn="desktop"
/>;
```

### コンテナコンポーネント

複数の広告をまとめて表示する場合はコンテナコンポーネントを使用します：

```tsx
import { FooterAds } from "@/components/ads/containers/FooterAds";

<FooterAds
  adTypes={["ninja", "a8net", "rakuten"]}
  shouldShowAd={(adType) => true} // 条件付き表示のロジック
/>;
```

## 開発者向け情報

新しい広告プロバイダーやコンポーネントを追加する際は、以下の点に留意してください：

1. 適切なディレクトリに配置する
2. `base/AdComponent`を基本コンポーネントとして継承する
3. アクセシビリティを考慮する（aria-label 等）
4. レスポンシブ対応する（displayOn プロパティの活用）
5. パフォーマンスに配慮する（lazyOnload 等）
