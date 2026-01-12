import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/shared/ui/button";

const meta: Meta<typeof Button> = {
  title: "shared/Button",
  component: Button,
  args: {
    children: "Button",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};
