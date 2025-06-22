import type { Meta, StoryObj } from "@storybook/react";
import { tabs } from "./tabs";

export default {
  title: "Components/Ui/tabs",
  component: tabs,
} satisfies Meta<typeof tabs>;

type Story = StoryObj<typeof tabs>;

export const Default: Story = {
  args: {},
};
