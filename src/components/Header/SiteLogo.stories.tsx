import type { Meta, StoryObj } from "@storybook/react";
import { SiteLogo } from "./SiteLogo";

export default {
  title: "Components/Header/SiteLogo",
  component: SiteLogo,
} satisfies Meta<typeof SiteLogo>;

type Story = StoryObj<typeof SiteLogo>;

export const Default: Story = {
  args: {},
};
