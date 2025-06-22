import type { Meta, StoryObj } from "@storybook/react";
import { inline-code } from "./inline-code";

export default {
  title: "Components/inline-code",
  component: inline-code,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof inline-code>;

type Story = StoryObj<typeof inline-code>;

export const Default: Story = {
  args: {},
};
