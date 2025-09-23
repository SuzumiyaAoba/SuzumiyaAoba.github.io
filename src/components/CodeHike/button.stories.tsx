import type { Meta, StoryObj } from "@storybook/nextjs";
import { CopyButton } from "./button";

export default {
  title: "Components/CodeHike/button",
  component: CopyButton,
} satisfies Meta<typeof CopyButton>;

type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {
  args: {},
};
