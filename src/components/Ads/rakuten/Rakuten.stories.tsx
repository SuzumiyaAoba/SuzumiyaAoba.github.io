import type { Meta, StoryObj } from "@storybook/react";
import { Rakuten } from "./Rakuten";

export default {
  title: "Components/Ads/Rakuten/Rakuten",
  component: Rakuten,
} satisfies Meta<typeof Rakuten>;

type Story = StoryObj<typeof Rakuten>;

export const Default: Story = {
  args: {},
};
