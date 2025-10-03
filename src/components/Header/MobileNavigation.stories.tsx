import type { Meta, StoryObj } from "@storybook/react";
import { MobileNavigation } from "./MobileNavigation";

export default {
  title: "Components/Header/MobileNavigation",
  component: MobileNavigation,
} satisfies Meta<typeof MobileNavigation>;

type Story = StoryObj<typeof MobileNavigation>;

export const Default: Story = {
  args: {},
};
