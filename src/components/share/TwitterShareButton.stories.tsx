import type { Meta, StoryObj } from "@storybook/react";
import { TwitterShareButton } from "./TwitterShareButton";

export default {
  title: "Components/TwitterShareButton",
  component: TwitterShareButton,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TwitterShareButton>;

type Story = StoryObj<typeof TwitterShareButton>;

export const Default: Story = {
  args: {},
};
