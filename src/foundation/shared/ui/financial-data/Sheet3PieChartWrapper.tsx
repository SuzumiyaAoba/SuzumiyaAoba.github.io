"use client";

import { AssetDistributionPieCharts } from "./_shared/asset-distribution-pie-charts";
import { getAssetSheet } from "./_shared/asset-sheets";
import {
  SHEET3_EXCLUDE_HEADERS,
  SHEET3_LABEL_MAP,
} from "./_shared/sheet3-asset-labels";

export const Sheet3PieChartWrapper: React.FC = () => (
  <AssetDistributionPieCharts
    data={getAssetSheet("3")}
    title="金融資産保有額の分布"
    excludeHeaders={SHEET3_EXCLUDE_HEADERS}
    labelMap={SHEET3_LABEL_MAP}
  />
);
