import type { Meta, StoryObj } from "@storybook/react";
import { HatenaButton } from "./HatenaButton";

export default {
  title: "Components/HatenaButton",
  component: HatenaButton,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof HatenaButton>;

type Story = StoryObj<typeof HatenaButton>;

export const Default: Story = {
  args: {},
};
