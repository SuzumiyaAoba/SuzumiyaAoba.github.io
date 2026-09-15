"use client";

import { AssetDistributionPieCharts } from "./_shared/asset-distribution-pie-charts";
import { getAssetSheet } from "./_shared/asset-sheets";
import {
  SHEET4_EXCLUDE_HEADERS,
  SHEET4_LABEL_MAP,
} from "./_shared/sheet4-asset-labels";

export const Sheet4PieChartWrapper: React.FC = () => (
  <AssetDistributionPieCharts
    data={getAssetSheet("4")}
    title="金融資産保有額の分布（金融資産を保有していない世帯を含む）"
    excludeHeaders={SHEET4_EXCLUDE_HEADERS}
    labelMap={SHEET4_LABEL_MAP}
  />
);
