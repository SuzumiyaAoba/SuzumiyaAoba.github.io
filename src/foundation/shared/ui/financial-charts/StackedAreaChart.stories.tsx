import type { Meta, StoryObj } from "@storybook/react";
import type { SheetData } from "./types";

import { StackedAreaChart } from "@/shared/ui/financial-charts/StackedAreaChart";

const dummyData: SheetData = {
  metadata: { title: "Category Breakdown" },
  headers: ["Year", "Product A", "Product B", "Product C"],
  series: [
    { year: "2020", values: { "Product A": 30, "Product B": 20, "Product C": 10 } },
    { year: "2021", values: { "Product A": 35, "Product B": 25, "Product C": 15 } },
    { year: "2022", values: { "Product A": 40, "Product B": 30, "Product C": 20 } },
    { year: "2023", values: { "Product A": 45, "Product B": 35, "Product C": 25 } },
  ],
};

const meta: Meta<typeof StackedAreaChart> = {
  title: "shared/financial-charts/StackedAreaChart",
  component: StackedAreaChart,
  args: {
    data: dummyData,
    groups: [{ name: "Products", metrics: ["Product A", "Product B", "Product C"] }],
    title: "Category Breakdown",
  },
};

export default meta;

type Story = StoryObj<typeof StackedAreaChart>;

export const Default: Story = {};
