import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { LineChart, PieChart, SheetData, StackedBarChart } from "@/shared/ui/financial-charts";
import { Sheet1ChartWrapper } from "../Sheet1ChartWrapper";
import { Sheet1BarLineChartWrapper } from "../Sheet1BarLineChartWrapper";
import { Sheet2ChartWrapper } from "../Sheet2ChartWrapper";
import { Sheet2BarChartWrapper } from "../Sheet2BarChartWrapper";
import { Sheet3AmountChartWrapper } from "../Sheet3AmountChartWrapper";
import { Sheet4AmountChartWrapper } from "../Sheet4AmountChartWrapper";
import { AssetAmountChart } from "./asset-amount-chart";
import { AssetDistributionPieCharts } from "./asset-distribution-pie-charts";

const { line, bar, pie } = vi.hoisted(() => ({
  line: vi.fn<(props: ComponentProps<typeof LineChart>) => null>(() => null),
  bar: vi.fn<(props: ComponentProps<typeof StackedBarChart>) => null>(() => null),
  pie: vi.fn<(props: ComponentProps<typeof PieChart>) => null>(() => null),
}));
vi.mock(import("@/shared/ui/financial-charts"), async (importOriginal) => ({
  ...(await importOriginal()),
  LineChart: line,
  StackedBarChart: bar,
  PieChart: pie,
}));

const data: SheetData = {
  metadata: { title: "金融資産の分布" },
  headers: ["少額 | ％", "高額 | ％", "未回答 | ％", "平均 | 万円", "中央値 | 万円"],
  series: [
    {
      year: "2023",
      values: {
        "少額 | ％": 25,
        "高額 | ％": null,
        "未回答 | ％": null,
        "平均 | 万円": 1001,
        "中央値 | 万円": 0,
      },
    },
    {
      year: "2024",
      values: {
        "少額 | ％": 0,
        "高額 | ％": 30,
        "未回答 | ％": null,
        "平均 | 万円": 1420,
        "中央値 | 万円": null,
      },
    },
    {
      year: "2025",
      values: {
        "少額 | ％": 45,
        "高額 | ％": 20,
        "未回答 | ％": null,
        "平均 | 万円": 1490,
        "中央値 | 万円": 800,
      },
    },
  ],
};
const pieProps = {
  title: "分布の比較",
  excludeHeaders: ["平均 | 万円", "中央値 | 万円"],
  labelMap: { "少額 | ％": "少額" },
};

beforeEach(() => vi.clearAllMocks());

describe("金融資産グラフの表示用データ", () => {
  it("口座・金融商品の分類と軸を折れ線・棒グラフで揃え、同じ解析結果を使う", () => {
    renderToStaticMarkup(<Sheet1ChartWrapper />);
    renderToStaticMarkup(<Sheet1BarLineChartWrapper />);
    const lineProps = line.mock.calls[0]?.[0];
    const barProps = bar.mock.calls[0]?.[0];
    expect(lineProps).toStrictEqual(barProps);
    expect(lineProps?.data).toBe(barProps?.data);
    expect(lineProps?.config).toStrictEqual({
      yAxisMin: 0,
      yAxisMax: 100,
      yAxisLabel: "%",
      startYear: 2006,
    });
    expect(lineProps?.groups?.[0]).toStrictEqual({
      name: "口座の有無（注１）",
      metrics: [
        "銀行口座および 証券口座を保有している | ％",
        "銀行口座のみ 保有している | ％",
        "証券口座のみ 保有している | ％",
        "口座を保有 していない | ％",
      ],
    });
    expect(lineProps?.groups?.[1]?.metrics).toContain("株式 | ％");
    expect(lineProps?.excludeHeaders).toStrictEqual([
      "現在保有している金融商品 | 預貯金 （ゆうちょ銀行の貯金を含む） | ％",
    ]);
  });

  it("金融資産保有状況の分類には金額の系列を混ぜない", () => {
    renderToStaticMarkup(<Sheet2ChartWrapper />);
    renderToStaticMarkup(<Sheet2BarChartWrapper />);
    const props = line.mock.calls[0]?.[0];
    expect(props).toStrictEqual(bar.mock.calls[0]?.[0]);
    expect(props?.config?.startYear).toBe(1963);
    expect(props?.groups).toStrictEqual([
      {
        name: "金融資産の有無（注1）",
        metrics: ["金融資産の有無（注1） | 保有している | ％", "保有して いない | ％"],
      },
      {
        name: "金融資産非保有世帯の預貯金口座の有無（注2）",
        metrics: [
          "金融資産非保有世帯の預貯金口座の有無（注2） | 口座を保有 していて、 現在、 残高がある | ％ | （保有している）",
          "口座は保有 しているが、現在、 残高はない | , | ％",
          "口座を保有 していない | ％ | （保有していない）",
        ],
      },
    ]);
  });

  it("平均・中央値だけを表示し、金額の最大値を500万円刻みに切り上げる", () => {
    renderToStaticMarkup(<AssetAmountChart data={data} startYear={1963} />);
    expect(line.mock.calls[0]?.[0]).toMatchObject({
      data,
      groups: [],
      excludeHeaders: ["少額 | ％", "高額 | ％", "未回答 | ％"],
      config: {
        yAxisMin: 0,
        yAxisMax: 1500,
        yAxisLabel: "万円",
        startYear: 1963,
        labelMap: { "平均 | 万円": "平均", "中央値 | 万円": "中央値" },
      },
    });
  });

  it("異なる世帯範囲のグラフでデータ・開始年・軸の最大値を区別する", () => {
    renderToStaticMarkup(<Sheet3AmountChartWrapper />);
    renderToStaticMarkup(<Sheet4AmountChartWrapper />);
    expect(line.mock.calls[0]?.[0].config).toMatchObject({ startYear: 1963, yAxisMax: 2500 });
    expect(line.mock.calls[1]?.[0].config).toMatchObject({ startYear: 2004, yAxisMax: 2000 });
    expect(line.mock.calls[0]?.[0].data).not.toBe(line.mock.calls[1]?.[0].data);
  });

  it("年別の円グラフは欠損値を除外し、ゼロと年・項目の順序を保つ", () => {
    const html = renderToStaticMarkup(<AssetDistributionPieCharts data={data} {...pieProps} />);
    expect(html).toContain("分布の比較");
    expect(
      pie.mock.calls.map(([props]) => ({ title: props.title, data: props.data })),
    ).toStrictEqual([
      { title: "2023年", data: [{ label: "少額", value: 25 }] },
      {
        title: "2024年",
        data: [
          { label: "少額", value: 0 },
          { label: "高額 | ％", value: 30 },
        ],
      },
      {
        title: "2025年",
        data: [
          { label: "少額", value: 45 },
          { label: "高額 | ％", value: 20 },
        ],
      },
    ]);
  });

  it("比較する年が欠けているときは部分的な円グラフを表示しない", () => {
    const incomplete = { ...data, series: data.series.filter((series) => series.year !== "2024") };
    expect(
      renderToStaticMarkup(<AssetDistributionPieCharts data={incomplete} {...pieProps} />),
    ).toContain("2023年、2024年、または2025年のデータが見つかりません");
    expect(pie).not.toHaveBeenCalled();
  });

  it("シートが読み込めなければ共通の空表示を使う", () => {
    expect(renderToStaticMarkup(<AssetAmountChart data={null} startYear={1963} />)).toContain(
      "データが見つかりません",
    );
    expect(
      renderToStaticMarkup(<AssetDistributionPieCharts data={null} {...pieProps} />),
    ).toContain("データが見つかりません");
    expect(line).not.toHaveBeenCalled();
    expect(pie).not.toHaveBeenCalled();
  });
});
