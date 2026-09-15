import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import type { SheetData } from "./types";

import { StackedBarChart } from "@/shared/ui/financial-charts/StackedBarChart";

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

const meta: Meta<typeof StackedBarChart> = {
  title: "shared/financial-charts/StackedBarChart",
  component: StackedBarChart,
  args: {
    data: dummyData,
  },
};

export default meta;

type Story = StoryObj<typeof StackedBarChart>;

export const Default: Story = {};

export const GroupSelection: Story = {
  args: {
    groups: [
      { name: "Primary products", metrics: ["Product A", "Product B"] },
      { name: "Other products", metrics: ["Product C"] },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("button", { name: "Primary products" });
    await userEvent.click(group);
    await expect(
      canvas.getByRole("button", { name: "Product A" })
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      canvas.getByRole("button", { name: "Product B" })
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      canvas.getByRole("button", { name: "Product C" })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvasElement.querySelectorAll("svg")[0]?.querySelectorAll("rect")
    ).toHaveLength(0);
    await userEvent.click(group);
    await expect(
      canvas.getByRole("button", { name: "Product A" })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvasElement.querySelectorAll("svg")[0]?.querySelectorAll("rect")
    ).toHaveLength(8);
  },
};
