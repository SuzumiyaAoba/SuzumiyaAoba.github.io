import type { Meta, StoryObj } from "@storybook/react";
import { button } from "./button";

export default {
  title: "Components/button",
  component: button,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof button>;

type Story = StoryObj<typeof button>;

export const Default: Story = {
  args: {},
};
