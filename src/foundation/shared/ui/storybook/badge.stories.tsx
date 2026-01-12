import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "@/shared/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "shared/Badge",
  component: Badge,
  args: {
    children: "Badge",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};
