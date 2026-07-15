"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section21Data from "@/content/blog/2026-01-01-kakekin/data/section21.json";

const labelMap: Record<string, string> = {
  "預貯金 | ％": "預貯金",
  "信託 | ％": "信託",
  "積立型保険商品 | ％": "積立型保険",
  "個人年金保険 | ％": "個人年金保険",
  "公共債 | ％": "公共債",
  "公共債以外の債券 | ％": "社債等",
  "株式 | ％": "株式",
  "株式投資信託 | ％": "株式投信",
  "公社債投資信託 | ％": "公社債投信",
  "外貨建金融商品 | ％": "外貨建商品",
  "不動産投資信託 | ％": "REIT",
  "保有希望はない | ％": "保有希望なし",
};

export const Section21ChartWrapper = createLineChartWrapper({
  data: section21Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 60,
    yAxisLabel: "％",
    startYear: 1999,
    labelMap,
  },
});
