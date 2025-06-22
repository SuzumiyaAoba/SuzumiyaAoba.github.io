import type { Meta, StoryObj } from "@storybook/react";
import { RectText } from "./RectText";

export default {
  title: "Components/RectText",
  component: RectText,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof RectText>;

type Story = StoryObj<typeof RectText>;

export const Default: Story = {
  args: {},
};
