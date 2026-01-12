import type { Meta, StoryObj } from "@storybook/react";

import { Separator } from "@/shared/ui/separator";

const meta: Meta<typeof Separator> = {
  title: "shared/Separator",
  component: Separator,
};

export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-64">
      <div className="text-sm">Section A</div>
      <Separator className="my-3" />
      <div className="text-sm">Section B</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-24 items-center gap-4">
      <span className="text-sm">Left</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Right</span>
    </div>
  ),
};
