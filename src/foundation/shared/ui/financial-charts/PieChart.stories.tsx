import type { Meta, StoryObj } from "@storybook/react";

import { PieChart } from "@/shared/ui/financial-charts/PieChart";

const dummyData = [
  { label: "Category A", value: 40 },
  { label: "Category B", value: 30 },
  { label: "Category C", value: 20 },
  { label: "Category D", value: 10 },
];

const meta: Meta<typeof PieChart> = {
  title: "shared/financial-charts/PieChart",
  component: PieChart,
  args: {
    data: dummyData,
    title: "Portfolio Allocation",
  },
};

export default meta;

type Story = StoryObj<typeof PieChart>;

export const Default: Story = {};
