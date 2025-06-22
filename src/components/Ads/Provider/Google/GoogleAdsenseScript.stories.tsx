import type { Meta, StoryObj } from "@storybook/react";
import { GoogleAdsenseScript } from "./GoogleAdsenseScript";

export default {
  title: "Components/Ads/Provider/Google/GoogleAdsenseScript",
  component: GoogleAdsenseScript,
} satisfies Meta<typeof GoogleAdsenseScript>;

type Story = StoryObj<typeof GoogleAdsenseScript>;

export const Default: Story = {
  args: {},
};
