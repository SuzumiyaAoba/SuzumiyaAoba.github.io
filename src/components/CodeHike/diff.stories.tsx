import type { Meta, StoryObj } from "@storybook/react";
import { diff } from "./diff";

export default {
  title: "Components/CodeHike/diff",
  component: diff,
} satisfies Meta<typeof diff>;

type Story = StoryObj<typeof diff>;

export const Default: Story = {
  args: {},
};
