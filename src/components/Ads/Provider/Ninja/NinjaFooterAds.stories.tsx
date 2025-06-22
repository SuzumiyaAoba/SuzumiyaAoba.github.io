import type { Meta, StoryObj } from "@storybook/react";
import { NinjaFooterAds } from "./NinjaFooterAds";

export default {
  title: "Components/NinjaFooterAds",
  component: NinjaFooterAds,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof NinjaFooterAds>;

type Story = StoryObj<typeof NinjaFooterAds>;

export const Default: Story = {
  args: {},
};
