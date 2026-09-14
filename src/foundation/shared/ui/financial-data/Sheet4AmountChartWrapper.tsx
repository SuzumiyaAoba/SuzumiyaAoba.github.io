"use client";

import { AssetAmountChart } from "./_shared/asset-amount-chart";
import { getAssetSheet } from "./_shared/asset-sheets";

export const Sheet4AmountChartWrapper: React.FC = () => (
  <AssetAmountChart data={getAssetSheet("4")} startYear={2004} />
);
