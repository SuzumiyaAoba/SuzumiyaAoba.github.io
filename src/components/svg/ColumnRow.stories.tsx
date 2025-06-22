import type { Meta, StoryObj } from "@storybook/react";
import { ColumnRow } from "./ColumnRow";

export default {
  title: "Components/Svg/ColumnRow",
  component: ColumnRow,
} satisfies Meta<typeof ColumnRow>;

type Story = StoryObj<typeof ColumnRow>;

export const Default: Story = {
  args: {},
};
