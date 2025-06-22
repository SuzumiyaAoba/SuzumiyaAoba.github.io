import type { Meta, StoryObj } from "@storybook/react";
import { BuyMeACoffee } from "./index";

export default {
  title: "Components/BuyMeACoffee",
  component: BuyMeACoffee,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof BuyMeACoffee>;

type Story = StoryObj<typeof BuyMeACoffee>;

export const Default: Story = {
  args: {},
};
