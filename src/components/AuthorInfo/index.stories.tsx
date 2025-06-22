import type { Meta, StoryObj } from "@storybook/react";
import { AuthorInfo } from "./index";

export default {
  title: "Components/AuthorInfo",
  component: AuthorInfo,
} satisfies Meta<typeof AuthorInfo>;

type Story = StoryObj<typeof AuthorInfo>;

export const Default: Story = {
  args: {},
};
