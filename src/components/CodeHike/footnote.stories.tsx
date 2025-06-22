import type { Meta, StoryObj } from "@storybook/react";
import { footnote } from "./footnote";

export default {
  title: "Components/footnote",
  component: footnote,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof footnote>;

type Story = StoryObj<typeof footnote>;

export const Default: Story = {
  args: {},
};
