"use client";

import { AssetAmountChart } from "./_shared/asset-amount-chart";
import { getAssetSheet } from "./_shared/asset-sheets";

export const Sheet3AmountChartWrapper: React.FC = () => (
  <AssetAmountChart data={getAssetSheet("3")} startYear={1963} />
);
