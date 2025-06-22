import type { Meta, StoryObj } from "@storybook/react";
import { GitHubCodeLink } from "./GitHubCodeLink";

export default {
  title: "Components/Mdx/GitHubCodeLink",
  component: GitHubCodeLink,
} satisfies Meta<typeof GitHubCodeLink>;

type Story = StoryObj<typeof GitHubCodeLink>;

export const Default: Story = {
  args: {
    url: "https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io/blob/master/src/components/Mdx/GitHubCodeLink.tsx",
    skipPath: 4,
  },
};
