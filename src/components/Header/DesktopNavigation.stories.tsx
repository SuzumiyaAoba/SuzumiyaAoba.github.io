import type { Meta, StoryObj } from "@storybook/nextjs";
import { DesktopNavigation } from "./DesktopNavigation";

export default {
  title: "Components/Header/DesktopNavigation",
  component: DesktopNavigation,
} satisfies Meta<typeof DesktopNavigation>;

type Story = StoryObj<typeof DesktopNavigation>;

export const Default: Story = {
  args: {},
};
