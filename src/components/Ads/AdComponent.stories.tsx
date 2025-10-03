import type { Meta, StoryObj } from "@storybook/react";
import { AdComponent } from "./AdComponent";

export default {
  title: "Components/Ads/AdComponent",
  component: AdComponent,
} satisfies Meta<typeof AdComponent>;

type Story = StoryObj<typeof AdComponent>;

export const Default: Story = {
  args: {},
};
