import type { Meta, StoryObj } from "@storybook/react";
import { MobileNavigation } from "./MobileNavigation";

export default {
  title: "Components/MobileNavigation",
  component: MobileNavigation,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof MobileNavigation>;

type Story = StoryObj<typeof MobileNavigation>;

export const Default: Story = {
  args: {},
};
