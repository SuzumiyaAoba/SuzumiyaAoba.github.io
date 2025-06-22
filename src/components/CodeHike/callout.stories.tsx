import type { Meta, StoryObj } from "@storybook/react";
import { callout } from "./callout";

export default {
  title: "Components/callout",
  component: callout,
} satisfies Meta<typeof callout>;

type Story = StoryObj<typeof callout>;

export const Default: Story = {
  args: {},
};
