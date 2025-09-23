import type { Meta, StoryObj } from "@storybook/nextjs";
import BuyMeACoffee from "./index";

export default {
  title: "Components/BuyMeACoffee",
  component: BuyMeACoffee,
} satisfies Meta<typeof BuyMeACoffee>;

type Story = StoryObj<typeof BuyMeACoffee>;

export const Default: Story = {
  args: {},
};
