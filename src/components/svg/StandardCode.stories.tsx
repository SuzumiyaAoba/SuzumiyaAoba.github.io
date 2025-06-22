import type { Meta, StoryObj } from "@storybook/react";
import { StandardCode } from "./StandardCode";

export default {
  title: "Components/StandardCode",
  component: StandardCode,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof StandardCode>;

type Story = StoryObj<typeof StandardCode>;

export const Default: Story = {
  args: {},
};
