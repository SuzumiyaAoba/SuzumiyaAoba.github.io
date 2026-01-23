import type { Meta, StoryObj } from "@storybook/react";
import type { SheetData } from "./types";

import { LineChart } from "@/shared/ui/financial-charts/LineChart";

const dummyData: SheetData = {
  metadata: { title: "Revenue Growth" },
  headers: ["Year", "Revenue", "Cost", "Profit"],
  series: [
    { year: "2020", values: { Revenue: 100, Cost: 80, Profit: 20 } },
    { year: "2021", values: { Revenue: 120, Cost: 90, Profit: 30 } },
    { year: "2022", values: { Revenue: 150, Cost: 100, Profit: 50 } },
    { year: "2023", values: { Revenue: 180, Cost: 110, Profit: 70 } },
    { year: "2024", values: { Revenue: 220, Cost: 120, Profit: 100 } },
  ],
};

const meta: Meta<typeof LineChart> = {
  title: "shared/financial-charts/LineChart",
  component: LineChart,
  args: {
    data: dummyData,
    config: {
      yAxisLabel: "M",
    },
  },
};

export default meta;

type Story = StoryObj<typeof LineChart>;

export const Default: Story = {};

export const WithExcludedHeaders: Story = {
  args: {
    excludeHeaders: ["Cost", "Profit"],
  },
};
