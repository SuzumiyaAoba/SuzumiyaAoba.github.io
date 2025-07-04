import type { Meta, StoryObj } from "@storybook/react";
import { B5B7Rows } from "./B5B7Rows";

export default {
  title: "Components/Svg/B5B7Rows",
  component: B5B7Rows,
} satisfies Meta<typeof B5B7Rows>;

type Story = StoryObj<typeof B5B7Rows>;

export const Default: Story = {
  args: {},
};
