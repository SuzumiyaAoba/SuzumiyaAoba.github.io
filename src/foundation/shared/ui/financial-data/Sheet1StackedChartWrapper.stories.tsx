import type { Meta, StoryObj } from "@storybook/react";
import { Sheet1StackedChartWrapper } from "./Sheet1StackedChartWrapper";

const meta: Meta<typeof Sheet1StackedChartWrapper> = {
  title: "shared/financial-data/Sheet1StackedChartWrapper",
  component: Sheet1StackedChartWrapper,
};

export default meta;

type Story = StoryObj<typeof Sheet1StackedChartWrapper>;

export const Default: Story = {};
