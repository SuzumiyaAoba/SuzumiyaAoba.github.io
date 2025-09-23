import type { Meta, StoryObj } from "@storybook/nextjs";
import { NinjaFooterAds } from "./NinjaFooterAds";

export default {
  title: "Components/Ads/Provider/Ninja/NinjaFooterAds",
  component: NinjaFooterAds,
} satisfies Meta<typeof NinjaFooterAds>;

type Story = StoryObj<typeof NinjaFooterAds>;

export const Default: Story = {
  args: {},
};
