import type { Meta, StoryObj } from "@storybook/react";
import { GoogleAdsenseScript } from "./GoogleAdsenseScript";

export default {
  title: "Components/GoogleAdsenseScript",
  component: GoogleAdsenseScript,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof GoogleAdsenseScript>;

type Story = StoryObj<typeof GoogleAdsenseScript>;

export const Default: Story = {
  args: {},
};
