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
    <div
      style={{
        width: "300px",
        height: "250px",
        background: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <GoogleAdsenseAd {...args} />
      <p style={{ position: "absolute" }}>Ad Placeholder</p>
    </div>
  ),
};
