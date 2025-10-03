import type { Meta, StoryObj } from "@storybook/react";
import { FooterAds } from "./FooterAds";

export default {
  title: "Components/Ads/FooterAds",
  component: FooterAds,
} satisfies Meta<typeof FooterAds>;

type Story = StoryObj<typeof FooterAds>;

export const Default: Story = {
  args: {},
};
