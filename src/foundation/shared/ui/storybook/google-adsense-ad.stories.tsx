import type { Meta, StoryObj } from "@storybook/react";

import { GoogleAdsenseAd } from "@/shared/ui/google-adsense-ad";

const meta: Meta<typeof GoogleAdsenseAd> = {
  title: "shared/GoogleAdsenseAd",
  component: GoogleAdsenseAd,
  args: {
    slot: "1234567890",
  },
};

export default meta;

type Story = StoryObj<typeof GoogleAdsenseAd>;

export const Default: Story = {
  render: (args) => (
    <div className="relative flex h-62.5 w-75 items-center justify-center bg-muted">
      <GoogleAdsenseAd {...args} />
      <p className="absolute">Ad Placeholder</p>
    </div>
  ),
};
