import type { Meta, StoryObj } from "@storybook/react";

import { Label } from "@/shared/ui/label";

const meta: Meta<typeof Label> = {
  title: "shared/Label",
  component: Label,
  args: {
    children: "Label",
  },
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {};
