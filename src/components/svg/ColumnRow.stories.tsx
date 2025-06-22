import type { Meta, StoryObj } from "@storybook/react";
import { ColumnRow } from "./ColumnRow";

export default {
  title: "Components/ColumnRow",
  component: ColumnRow,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ColumnRow>;

type Story = StoryObj<typeof ColumnRow>;

export const Default: Story = {
  args: {},
};
