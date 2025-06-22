import type { Meta, StoryObj } from "@storybook/react";
import { mark } from "./mark";

export default {
  title: "Components/CodeHike/mark",
  component: mark,
} satisfies Meta<typeof mark>;

type Story = StoryObj<typeof mark>;

export const Default: Story = {
  args: {},
};
