import type { Meta, StoryObj } from "@storybook/react";
import { FooterAds } from "./FooterAds";

export default {
  title: "Components/FooterAds",
  component: FooterAds,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FooterAds>;

type Story = StoryObj<typeof FooterAds>;

export const Default: Story = {
  args: {},
};
