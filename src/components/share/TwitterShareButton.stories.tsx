import type { Meta, StoryObj } from "@storybook/nextjs";
import { TwitterShareButton } from "./TwitterShareButton";

export default {
  title: "Components/Share/TwitterShareButton",
  component: TwitterShareButton,
} satisfies Meta<typeof TwitterShareButton>;

type Story = StoryObj<typeof TwitterShareButton>;

export const Default: Story = {
  args: {},
};
