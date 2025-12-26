# Charts コンポーネント

財務データ可視化のための汎用グラフコンポーネントライブラリ。

## コンポーネント一覧

### LineChart

折れ線グラフを描画するコンポーネント。

**Props:**

- `data: SheetData` - グラフに表示するデータ
- `groups?: MetricGroup[]` - メトリクスのグループ化設定（オプション）
- `config?: ChartConfig` - グラフの設定（オプション）
- `excludeHeaders?: string[]` - 除外するヘッダー（オプション）

**使用例:**

```tsx
import { LineChart } from "@/components/Charts";
import type { MetricGroup } from "@/components/Charts";

const groups: MetricGroup[] = [
  {
    name: "グループ1",
    metrics: ["メトリクス1", "メトリクス2"]
  },
  {
    name: "グループ2",
    metrics: ["メトリクス3", "メトリクス4"]
  }
];

<LineChart
  data={sheetData}
  groups={groups}
  config={{
    yAxisMin: 0,
    yAxisMax: 100,
    yAxisLabel: "%",
    startYear: 2006
  }}
  excludeHeaders={["除外するヘッダー"]}
/>
```

### StackedBarChart

積み上げ棒グラフを描画するコンポーネント。

**Props:**

- `data: SheetData` - グラフに表示するデータ
- `groups?: MetricGroup[]` - メトリクスのグループ化設定（オプション）
- `config?: ChartConfig` - グラフの設定（オプション）
- `excludeHeaders?: string[]` - 除外するヘッダー（オプション）

**使用例:**

```tsx
import { StackedBarChart } from "@/components/Charts";
import type { MetricGroup } from "@/components/Charts";

const groups: MetricGroup[] = [
  {
    name: "グループ1",
    metrics: ["メトリクス1", "メトリクス2"]
  },
  {
    name: "グループ2",
    metrics: ["メトリクス3", "メトリクス4"]
  }
];

<StackedBarChart
  data={sheetData}
  groups={groups}
  config={{
    yAxisMin: 0,
    yAxisMax: 100,
    yAxisLabel: "%",
    startYear: 2006
  }}
  excludeHeaders={["除外するヘッダー"]}
/>
```

## 型定義

### SheetData

```typescript
type SheetData = {
  metadata: {
    title: string;
    toc_title?: string;
  };
  headers: string[];
  series: SeriesData[];
};
```

### SeriesData

```typescript
type SeriesData = {
  year: string;
  values: Record<string, number | null>;
};
```

### MetricGroup

```typescript
type MetricGroup = {
  name: string;
  metrics: string[];
};
```

### ChartConfig

```typescript
type ChartConfig = {
  yAxisMin?: number;      // Y軸の最小値（デフォルト: 0）
  yAxisMax?: number;      // Y軸の最大値（デフォルト: 100）
  yAxisLabel?: string;    // Y軸のラベル（デフォルト: "%"）
  startYear?: number;     // 開始年（デフォルト: 2006）
  colors?: string[];      // カスタムカラーパレット（デフォルト: d3.schemeCategory10）
};
```

## 機能

### 共通機能

- **インタラクティブな凡例**: クリックでメトリクスの表示/非表示を切り替え
- **グループ操作**: グループ名をクリックでグループ内の全メトリクスを一括操作
- **ツールチップ**: データポイントにマウスオーバーで詳細情報を表示
- **レスポンシブデザイン**: グリッド線とラベルで見やすい表示
- **初期状態**: すべてのメトリクスが初期選択状態

### LineChart の特徴

- データポイントを線で結ぶ
- 各データポイントに円形マーカーを表示
- マウスオーバーでハイライト

### StackedBarChart の特徴

- 複数のメトリクスを積み上げて表示
- グループごとに別々のグラフを描画
- 半透明の棒グラフで重なりを視覚化

## ラッパーコンポーネントの作成

新しいシート用のラッパーコンポーネントを作成する例:

```tsx
"use client";

import { LineChart } from "@/components/Charts";
import type { MetricGroup } from "@/components/Charts";
import assetsData from "@/contents/blog/2025-12-26-kakekin/data/assets.json";

export const Sheet2ChartWrapper: React.FC = () => {
  const sheetData = assetsData.sheets["2"];

  if (!sheetData) {
    return <div>データが見つかりません</div>;
  }

  // シート固有の設定
  const excludeHeaders = ["除外するヘッダー"];

  const groups: MetricGroup[] = [
    {
      name: "グループ1",
      metrics: ["メトリクス1", "メトリクス2"]
    }
  ];

  return (
    <LineChart
      data={sheetData}
      groups={groups}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "%",
        startYear: 2006
      }}
    />
  );
};
```

## 注意事項

- データは JSON 形式で `SheetData` 型に準拠している必要があります
- メトリクス名に `|` が含まれる場合、最初の要素のみが凡例に表示されます
- グループを指定しない場合、すべてのメトリクスが1つのグループとして扱われます
