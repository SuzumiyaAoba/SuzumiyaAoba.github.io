import type { Meta, StoryObj } from "@storybook/react";
import { DesktopNavigation } from "./DesktopNavigation";

export default {
  title: "Components/DesktopNavigation",
  component: DesktopNavigation,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DesktopNavigation>;

type Story = StoryObj<typeof DesktopNavigation>;

export const Default: Story = {
  args: {},
};
