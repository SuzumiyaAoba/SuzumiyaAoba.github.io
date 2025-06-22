import type { Meta, StoryObj } from "@storybook/react";
import { GitHubCodeLink } from "./GitHubCodeLink";

export default {
  title: "Components/GitHubCodeLink",
  component: GitHubCodeLink,
} satisfies Meta<typeof GitHubCodeLink>;

type Story = StoryObj<typeof GitHubCodeLink>;

export const Default: Story = {
  args: {},
};
