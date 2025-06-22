import type { Meta, StoryObj } from "@storybook/react";
import { Rakuten } from "./Rakuten";

export default {
  title: "Components/Rakuten",
  component: Rakuten,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Rakuten>;

type Story = StoryObj<typeof Rakuten>;

export const Default: Story = {
  args: {},
};
