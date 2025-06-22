import type { Meta, StoryObj } from "@storybook/react";
import { KiddyFirst } from "./KiddyFirst";

export default {
  title: "Components/Ads/Provider/Rakuten/ads/KiddyFirst",
  component: KiddyFirst,
} satisfies Meta<typeof KiddyFirst>;

type Story = StoryObj<typeof KiddyFirst>;

export const Default: Story = {
  args: {},
};
