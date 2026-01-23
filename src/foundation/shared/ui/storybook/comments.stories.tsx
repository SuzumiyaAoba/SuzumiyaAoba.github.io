import type { Meta, StoryObj } from "@storybook/react";

import { Comments } from "@/shared/ui/comments";

const meta: Meta<typeof Comments> = {
  title: "shared/Comments",
  component: Comments,
  args: {
    locale: "ja",
    repo: "example/repo",
    repoId: "R_example",
    category: "Announcements",
    categoryId: "DIC_example",
  },
  argTypes: {
    locale: {
      control: "radio",
      options: ["ja", "en"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Comments>;

export const Default: Story = {};
