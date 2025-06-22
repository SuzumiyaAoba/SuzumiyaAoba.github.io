import type { Meta, StoryObj } from "@storybook/react";
import { collapse } from "./collapse";

export default {
  title: "Components/collapse",
  component: collapse,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof collapse>;

type Story = StoryObj<typeof collapse>;

export const Default: Story = {
  args: {},
};
