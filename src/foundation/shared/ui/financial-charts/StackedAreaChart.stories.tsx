import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import type { SheetData } from "./types";

import { StackedAreaChart } from "@/shared/ui/financial-charts/StackedAreaChart";

const dummyData: SheetData = {
  metadata: { title: "Category Breakdown" },
  headers: ["Year", "Product A", "Product B", "Product C"],
  series: [
    {
      year: "2020",
      values: { "Product A": 30, "Product B": 20, "Product C": 10 },
    },
    {
      year: "2021",
      values: { "Product A": 35, "Product B": 25, "Product C": 15 },
    },
    {
      year: "2022",
      values: { "Product A": 40, "Product B": 30, "Product C": 20 },
    },
    {
      year: "2023",
      values: { "Product A": 45, "Product B": 35, "Product C": 25 },
    },
  ],
};

const meta: Meta<typeof StackedAreaChart> = {
  title: "shared/financial-charts/StackedAreaChart",
  component: StackedAreaChart,
  args: {
    data: dummyData,
    groups: [
      { name: "Products", metrics: ["Product A", "Product B", "Product C"] },
    ],
    title: "Category Breakdown",
  },
};

export default meta;

type Story = StoryObj<typeof StackedAreaChart>;

export const Default: Story = {};

export const MultipleCharts: Story = {
  render: (args) => (
    <>
      <StackedAreaChart {...args} />
      <StackedAreaChart {...args} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const patterns = [...canvasElement.querySelectorAll("pattern")];
    await expect(patterns).toHaveLength(20);
    await expect(new Set(patterns.map((pattern) => pattern.id)).size).toBe(20);
    for (const svg of canvasElement.querySelectorAll("svg")) {
      const localIds = new Set(
        [...svg.querySelectorAll("pattern")].map((pattern) => pattern.id)
      );
      for (const shape of svg.querySelectorAll('[fill^="url(#"]')) {
        const id = shape.getAttribute("fill")?.slice(5, -1);
        await expect(localIds.has(id ?? "")).toBe(true);
      }
    }
  },
};
