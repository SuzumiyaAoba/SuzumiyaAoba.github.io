import type { Meta, StoryObj } from "@storybook/nextjs";
import { KiddyFirst } from "./KiddyFirst";

export default {
  title: "Components/Ads/Rakuten/Ads/KiddyFirst",
  component: KiddyFirst,
} satisfies Meta<typeof KiddyFirst>;

type Story = StoryObj<typeof KiddyFirst>;

export const Default: Story = {
  args: {},
};
