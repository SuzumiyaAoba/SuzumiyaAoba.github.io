import type { Meta, StoryObj } from "@storybook/react";
import { HamburgerIcon } from "./HamburgerIcon";

export default {
  title: "Components/HamburgerIcon",
  component: HamburgerIcon,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof HamburgerIcon>;

type Story = StoryObj<typeof HamburgerIcon>;

export const Default: Story = {
  args: {},
};
